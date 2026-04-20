import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const MONTH_ORDER: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

type TimelineMonthRow = {
  year: string;
  month: string;
};

async function getTimelineData() {
  const yearly_data = await prisma.yearlyData.findMany({
    distinct: ["year"],
    orderBy: {
      year: "asc",
    },
  });

  const years = yearly_data.map((yearlyData) => yearlyData.year);

  const distributions = await prisma.distribution.findMany({
    distinct: ["year", "month"],
    select: {
      year: true,
      month: true,
    },
  });

  const validDistributions = distributions.reduce<TimelineMonthRow[]>((acc, distribution) => {
    if (
      distribution.month !== null &&
      distribution.year !== null &&
      distribution.month in MONTH_ORDER
    ) {
      acc.push({
        month: distribution.month,
        year: distribution.year,
      });
    }

    return acc;
  }, []);

  const months = validDistributions
    .map((distribution) => ({
      Month: distribution.month,
      Year: distribution.year,
    }))
    .sort((a, b) => {
      const yearDiff = Number(a.Year) - Number(b.Year);
      if (yearDiff !== 0) return yearDiff;

      return MONTH_ORDER[a.Month] - MONTH_ORDER[b.Month];
    });

  return { years, months };
}

export async function GET() {
  try {
    const data = await getTimelineData();

    if (data.years.length === 0 && data.months.length === 0) {
      return NextResponse.json(
        { years: [], months: [], message: "No distribution data has been uploaded yet" },
        { status: 200 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      console.error("Database query error fetching timeline data:", error);
      return NextResponse.json(
        { error: "Failed to query timeline data from the database" },
        { status: 503 },
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("Database connection error fetching timeline data:", error);
      return NextResponse.json({ error: "Could not connect to the database" }, { status: 503 });
    }

    console.error("Unexpected error fetching timeline data:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading timeline data" },
      { status: 500 },
    );
  }
}
