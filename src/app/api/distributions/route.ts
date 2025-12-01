import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

export async function GET() {
  const distributionsQuery = {
    include: {
      partner: {
        select: {
          name: true,
        },
      },
      city: {
        select: {
          name: true,
        },
      },
    },
  } satisfies PrismaTypes.DistributionFindManyArgs;

  type prismaDistributionsReturnType = PrismaTypes.DistributionGetPayload<
    typeof distributionsQuery
  >[];

  try {
    const distributions: prismaDistributionsReturnType =
      await prisma.distribution.findMany(distributionsQuery);

    const formattedData = distributions.map((dist) => ({
      id: dist.id.toString(),
      createdAt: dist.createdAt.toISOString(),
      partnerId: dist.partnerId?.toString() || null,
      cityId: dist.cityId?.toString() || null,
      year: dist.year,
      month: dist.month,
      numberDiapers: dist.numberDiapers?.toString() || null,
      numberChildren: dist.numberChildren?.toString() || null,
      percentage: dist.percentage,
      partner: dist.partner,
      city: dist.city,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching distributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch distributions" },
      { status: 500 }
    );
  }
}
