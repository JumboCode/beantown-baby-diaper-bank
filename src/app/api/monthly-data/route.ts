import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { month, Prisma } from "@/generated/prisma/client";

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

  const monthParam: month | null = searchParams.get("month") as month | null;
  const year: string | null = searchParams.get("year");

  const startYear: string | null = searchParams.get("startYear");
  const endYear: string | null = searchParams.get("endYear");

  const startMonth: month | null = searchParams.get(
    "startMonth",
  ) as month | null;
  const endMonth: month | null = searchParams.get("endMonth") as month | null;

  let where: Prisma.MonthlyDataWhereInput = {};

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
      ...(monthParam ? { month: monthParam } : {}),
      ...(year ? { year } : {}),
    };
  }

  const monthlyDataQuery = {
    where,
    include: {
      partner: { select: { name: true } },
    },
  };

  try {
    const distributionsArr =
      await prisma.monthlyData.findMany(monthlyDataQuery);

    const formattedData = distributionsArr.map((dist) => ({
      id: dist.id,
      partnerId: dist.partnerId.toString(),
      year: dist.year,
      month: dist.month,
      numberDiapers: dist.numDiapers?.toString() || null,
      numBabies: dist.numBabies?.toString() || null,
      partner: dist.partner,
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

type MonthlyDataPostInput = {
  partnerId: string | number;
  year: string;
  month: month;
  numDiapers?: string | number | null;
  numBabies?: string | number | null;
};

export async function POST(request: Request) {
  try {
    const newMonthlyData = (await request.json()) as MonthlyDataPostInput[];

    if (!Array.isArray(newMonthlyData)) {
      return NextResponse.json(
        { error: "Expected an array of Monthly Data values" },
        { status: 400 },
      );
    }

    const data: Prisma.MonthlyDataCreateManyInput[] = newMonthlyData.map(
      (row) => ({
        id: crypto.randomUUID(),
        partnerId: BigInt(row.partnerId),
        year: row.year,
        month: row.month,
        numDiapers:
          row.numDiapers === null || row.numDiapers === undefined
            ? null
            : BigInt(row.numDiapers),
        numBabies:
          row.numBabies === null || row.numBabies === undefined
            ? null
            : BigInt(row.numBabies),
      }),
    );

    await prisma.monthlyData.createMany({
      data,
    });

    return NextResponse.json(
      { message: "Monthly Data values created successfully" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "An error occurred while creating Monthly Data values" },
      { status: 500 },
    );
  }
}

type MonthlyDataPutInput = {
  partnerId: string | number;
  year: string;
  month: month;
  numDiapers?: string | number | null;
  numBabies?: string | number | null;
};

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as MonthlyDataPutInput;

    const partnerId = BigInt(body.partnerId);

    // Delete all existing rows for this partner/year/month, then create a fresh one
    await prisma.monthlyData.deleteMany({
      where: {
        partnerId,
        year: body.year,
        month: body.month,
      },
    });

    await prisma.monthlyData.create({
      data: {
        id: crypto.randomUUID(),
        partnerId,
        year: body.year,
        month: body.month,
        numDiapers:
          body.numDiapers == null ? null : BigInt(body.numDiapers),
        numBabies:
          body.numBabies == null ? null : BigInt(body.numBabies),
      },
    });

    return NextResponse.json(
      { message: "Monthly Data updated successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "An error occurred while updating Monthly Data" },
      { status: 500 },
    );
  }
}
