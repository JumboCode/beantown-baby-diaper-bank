import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { month, Prisma as PrismaTypes } from "@/generated/prisma/client";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { fetchCityGeoDataFromNominatim } from "@/lib/server/city";
import { capitalize } from "lodash";

async function getCities(cityName: string | null, month: string | null, year: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife({ revalidate: 2592000, stale: 604800 });
  if (month && !year) {
    throw new Error("Year must be provided if month is provided.");
  }

  const where: PrismaTypes.CityWhereInput = {};
  if (cityName) {
    where.name = {
      contains: cityName,
      mode: "insensitive",
    };
  }

  const statsQuery = await prisma.$queryRaw<
    { city_id: bigint; median: number; p25: number; p75: number }[]
  >`
      SELECT
        "city_id",
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY "num_diapers"), 0) as median,
        COALESCE(percentile_cont(0.25) WITHIN GROUP (ORDER BY "num_diapers"), 0) as p25,
        COALESCE(percentile_cont(0.75) WITHIN GROUP (ORDER BY "num_diapers"), 0) as p75
      FROM "Yearly Data"
      GROUP BY "city_id"
    `;

  const statsMap = new Map(
    statsQuery.map((row) => [
      Number(row.city_id),
      {
        median: Number(row.median),
        p25: Number(row.p25),
        p75: Number(row.p75),
      },
    ]),
  );

  let cumulativeTotalsMap = new Map<number, number>();
  if (year) {
    const cumulativeQuery = await prisma.yearlyData.groupBy({
      by: ["cityId"],
      where: { year: { lte: year } },
      _sum: { numDiapers: true },
    });
    cumulativeTotalsMap = new Map(
      cumulativeQuery.map((row) => [Number(row.cityId), Number(row._sum.numDiapers || 0)]),
    );
  }

  if (year && !month) {
    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        Yearly_Data: {
          where: {
            year: year,
          },
        },
        partnerRegions: {
          include: {
            partner: true,
          },
        },
      },
    });

    return cities.map((city) => ({
      id: Number(city.id),
      name: city.name,
      stats: {
        historical: statsMap.get(Number(city.id)) || null,
        runningTotal: cumulativeTotalsMap.get(Number(city.id)) || 0,
      },
      distributions: city.Yearly_Data.map((yd) => ({
        id: yd.id,
        year: yd.year,
        month: null, // Yearly data doesn't have month
        numberDiapers: Number(yd.numDiapers),
        numberChildren: Number(yd.numBabies),
        percentage: null, // Yearly data doesn't have percentage
        partner: null, // Yearly data doesn't have partner
      })),
      partners: city.partnerRegions.map((partnerRegion) => ({
        id: Number(partnerRegion.partnerId),
        name: partnerRegion.partner.name,
        logoUrl: partnerRegion.partner.logoUrl,
        status: partnerRegion.partner.status,
        startPartner: partnerRegion.partner.startPartner?.toISOString() || null,
      })),
    }));
  }

  const distributionWhere: PrismaTypes.DistributionWhereInput = {};
  if (month) {
    distributionWhere.month = month as month;
  }
  if (year) {
    distributionWhere.year = year;
  }

  const cityWithRelationArgs = {
    include: {
      distributions: {
        where: distributionWhere,
        include: {
          partner: true,
        },
      },
      partnerRegions: {
        include: {
          partner: true,
        },
      },
    },
  } satisfies PrismaTypes.CityFindManyArgs;

  type CityWithRelations = PrismaTypes.CityGetPayload<typeof cityWithRelationArgs>;

  const cities: CityWithRelations[] = await prisma.city.findMany({
    where,
    orderBy: { name: "asc" },
    include: cityWithRelationArgs.include,
  });

  const dataToReturn = cities.map((city) => ({
    id: Number(city.id),
    name: city.name,
    stats: {
      historical: statsMap.get(Number(city.id)) || null,
      runningTotal: cumulativeTotalsMap.get(Number(city.id)) || 0,
    },
    distributions: city.distributions.map((distribution) => ({
      id: Number(distribution.id),
      year: distribution.year,
      month: distribution.month,
      numberDiapers: Number(distribution.numberDiapers),
      numberChildren: Number(distribution.numberChildren),
      percentage: distribution.percentage,
      partner: {
        id: Number(distribution.partnerId),
        name: distribution.partner?.name,
      },
    })),
    partners: city.partnerRegions.map((partnerRegion) => ({
      id: Number(partnerRegion.partnerId),
      name: partnerRegion.partner.name,
      logoUrl: partnerRegion.partner.logoUrl,
      status: partnerRegion.partner.status,
      startPartner: partnerRegion.partner.startPartner?.toISOString() || null,
    })),
  }));

  return dataToReturn;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cityName = searchParams.get("name");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const data = await getCities(cityName, month, year);

  return Response.json({ data });
}

/**
 * Creates a new city. Expects a JSON body with a "name" field. Will fetch the city's centroid and boundary from Nominatim and store them in the database.
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const name: string = capitalize(body?.name?.trim());

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  // 1. Check if it already exists
  const existing = await prisma.city.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return Response.json({ error: "City already exists" }, { status: 409 });
  }

  // 2. Fetch centroid + boundary from Nominatim
  let geo: Awaited<ReturnType<typeof fetchCityGeoDataFromNominatim>>;
  try {
    geo = await fetchCityGeoDataFromNominatim(name);
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred while looking up the city.";
    const status =
      error instanceof Error && typeof error.cause === "number" ? Number(error.cause) : 502;
    return Response.json({ error: message }, { status });
  }

  // 3. Insert the city row, then set geometry columns via raw SQL
  let city: { id: bigint; name: string };
  try {
    city = await prisma.$transaction(async (tx) => {
      const newCity = await tx.city.create({ data: { name } });

      await tx.$executeRaw`
         UPDATE "Cities"
         SET
           "centroid" = ST_SetSRID(ST_GeomFromGeoJSON(${geo.centroidGeoJson}), 4326),
           "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${geo.boundaryGeoJson}), 4326)::geography
         WHERE id = ${newCity.id}
       `;

      return newCity;
    });
  } catch (error: unknown) {
    console.error("Error creating city:", error);
    return Response.json(
      { error: "An unexpected error occurred while creating the city." },
      { status: 500 },
    );
  }

  revalidateTag("cities", "max");

  return Response.json({ data: { id: Number(city.id), name: city.name } }, { status: 201 });
}
