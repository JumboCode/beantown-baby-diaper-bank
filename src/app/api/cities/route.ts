import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityName = searchParams.get("name");

  const cityWithRelationArgs = {
    include: {
      distributions: {
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

  try {
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
          logo: distribution.partner?.logoUrl,
        },
      })),
      partners: city.partnerRegions.map((partnerRegion) => ({
        id: Number(partnerRegion.partnerId),
        name: partnerRegion.partner.name,
      })),
    }));

    return NextResponse.json({ data: dataToReturn });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Unable to retrieve from the database.`;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
