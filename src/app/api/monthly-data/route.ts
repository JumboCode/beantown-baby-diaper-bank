import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { month, Prisma as PrismaTypes } from "@/generated/prisma/client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const month: month | null = searchParams.get("month") as month | null;
  const year: string | null = searchParams.get("year");

  let where: PrismaTypes.DistributionWhereInput = {};

  where = {
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };

  const distributionsQuery = {
    where,
    include: {
      partner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  } satisfies PrismaTypes.DistributionFindManyArgs;

  try {
    const distributionsArr =
      await prisma.distribution.findMany(distributionsQuery);

    const formattedData = distributionsArr.map(
      (dist: {
        id: bigint;
        partnerId: bigint | null;
        year: string | null;
        month: string | null;
        numberDiapers: bigint | null;
        partner: { name: string | null } | null;
      }) => ({
        id: dist.id.toString(),
        partnerId: dist.partnerId?.toString() || null,
        year: dist.year,
        month: dist.month,
        numberDiapers: dist.numberDiapers?.toString() || null,
        partner: dist.partner,
      }),
    );

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching distributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch distributions" },
      { status: 500 },
    );
  }
}

export async function POST() {
  return new Response(JSON.stringify({ message: "Hello World" }));
}
