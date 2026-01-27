import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

export async function GET(req:Request) {
  const { searchParams } = new URL(req.url);

  const month = searchParams.get("month"); // e.g. "May"
  const yearParam = searchParams.get("year"); // e.g. "2026"
  // const year = yearParam ? Number(yearParam) : null;

  // CHAT:
  const year = searchParams.get("year");        // "2025"  (keep as string)


  // Build WHERE only when params exist
  // const where: PrismaTypes.DistributionWhereInput = {
  //   ...(month ? { month } : {}),
  //   ...(year !== null && !Number.isNaN(year) ? { year } : {}),
  // };
  
  // CHAT:
    // Build WHERE only when params exist
    const where: PrismaTypes.DistributionWhereInput = {
      ...(month ? { month } : {}),  
      ...(year ? { year } : {}),                  // year is string in DB
  
    };



  // const distributionsQuery = {
  //   include: {
  //     partner: {
  //       select: {
  //         name: true,
  //       },
  //     },
  //     city: {
  //       select: {
  //         name: true,
  //       },
  //     },
  //   },
  // } satisfies PrismaTypes.DistributionFindManyArgs;

  const distributionsQuery = {
    where,
    include: {
    partner: { select: { name: true } },
    city: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
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
