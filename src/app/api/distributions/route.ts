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

  const startYear: string | null = searchParams.get("startYear");
  const endYear: string | null = searchParams.get("endYear");

  const startMonth: month | null = searchParams.get(
    "startMonth",
  ) as month | null;
  const endMonth: month | null = searchParams.get("endMonth") as month | null;

  let where: PrismaTypes.DistributionWhereInput = {};

  if (startMonth && startYear && endMonth && endYear) {
    const sYear = parseInt(startYear);
    const eYear = parseInt(endYear);
    const sMonthIdx = MONTH_NAMES.indexOf(startMonth);
    const eMonthIdx = MONTH_NAMES.indexOf(endMonth);

    if (sYear === eYear) {
      const monthsInRange: month[] = MONTH_NAMES.slice(
        sMonthIdx,
        eMonthIdx + 1,
      ) as month[];
      where = {
        year: startYear,
        month: { in: monthsInRange },
      };
    } else {
      const startYearMonths: month[] = MONTH_NAMES.slice(sMonthIdx) as month[];
      const endYearMonths: month[] = MONTH_NAMES.slice(
        0,
        eMonthIdx + 1,
      ) as month[];

      where = {
        OR: [
          {
            year: startYear,
            month: { in: startYearMonths },
          },
          {
            year: endYear,
            month: { in: endYearMonths },
          },
          {
            AND: [{ year: { gt: startYear } }, { year: { lt: endYear } }],
          },
        ],
      };
    }
  } else {
    // Single month/year filter
    where = {
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };
  }

  const distributionsQuery = {
    where,
    include: {
      partner: { select: { name: true } },
      city: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  } satisfies PrismaTypes.DistributionFindManyArgs;

  try {
    const distributionsArr =
      await prisma.distribution.findMany(distributionsQuery);

    const formattedData = distributionsArr.map(
      (dist: {
        id: bigint;
        createdAt: Date;
        partnerId: bigint | null;
        cityId: bigint | null;
        year: string | null;
        month: string | null;
        numberDiapers: bigint | null;
        numberChildren: bigint | null;
        percentage: number | null;
        partner: { name: string | null } | null;
        city: { name: string | null } | null;
      }) => ({
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

// For deleting distribution data of selection month and year
export async function DELETE(req: Request) {
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
