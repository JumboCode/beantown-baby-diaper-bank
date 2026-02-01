import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const month = searchParams.get("month"); // e.g. "May"
  const year = searchParams.get("year"); // e.g. "2026"

  // Build WHERE only when params exist
  const where: PrismaTypes.DistributionWhereInput = {
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };

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
      { status: 500 },
    );
  }
}

// For deleting distribution data of selection month and year
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = (body?.ids ?? []) as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    const parsedIds = ids.map((id) => BigInt(id));

    const result = await prisma.distribution.deleteMany({
      where: { id: { in: parsedIds } },
    });

    return NextResponse.json({ deletedCount: result.count });
  } catch (error) {
    console.error("Error deleting distributions:", error);
    return NextResponse.json(
      { error: "Failed to delete distributions" },
      { status: 500 },
    );
  }
}
