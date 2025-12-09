import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";
// need to revalidate only monthly
export const revalidate = 2592000;

const getCities = unstable_cache(
  async (
    cityName: string | null,
    month: string | null,
    year: string | null
  ) => {
    if (month && !year) {
      return NextResponse.json(
        { error: "Year must be provided if month is provided." },
        { status: 400 }
      );
    }

    const distributionWhere: PrismaTypes.DistributionWhereInput = {};
    if (month) {
      distributionWhere.month = month;
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

    type CityWithRelations = PrismaTypes.CityGetPayload<
      typeof cityWithRelationArgs
    >;

    /* build filters based on city name */
    const where: PrismaTypes.CityWhereInput = {};
    if (cityName) {
      where.name = {
        contains: cityName,
        mode: "insensitive",
      };
    }
    const cities: CityWithRelations[] = await prisma.city.findMany({
      where,
      orderBy: { name: "asc" },
      include: cityWithRelationArgs.include,
    });

    const dataToReturn = cities.map((city) => ({
      id: Number(city.id),
      name: city.name,
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
        logo_url: partnerRegion.partner.logoUrl,
      })),
    }));

    // build filters and run prisma.city.findMany(...) as you already do
    return dataToReturn; // your mapped result
  },
  ["cities"], // base cache key; args are added automatically
  { revalidate, tags: ["cities"] }
);
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityName = searchParams.get("name");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const dataToReturn = await getCities(cityName, month, year);

  return NextResponse.json(
    { data: dataToReturn },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=2592000, stale-while-revalidate=604800",
      },
    }
  );
}
