import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

async function getTotalDiapers(year: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  if (year) {
    const [cumulativeResults, yearlyResults] = await Promise.all([
      prisma.yearlyData.aggregate({
        where: { year: { lte: year } },
        _sum: { numDiapers: true },
      }),
      prisma.yearlyData.aggregate({
        where: { year },
        _sum: { numDiapers: true },
      }),
    ]);

    const totalDiapers =
      cumulativeResults._sum.numDiapers == null ? 0 : Number(cumulativeResults._sum.numDiapers);
    const yearlyTotalDiapers =
      yearlyResults._sum.numDiapers == null ? 0 : Number(yearlyResults._sum.numDiapers);

    return { totalDiapers, yearlyTotalDiapers };
  }

  const results = await prisma.yearlyData.aggregate({
    _sum: { numDiapers: true },
  });

  const totalDiapers = results._sum.numDiapers == null ? 0 : Number(results._sum.numDiapers);

  return { totalDiapers };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const data = await getTotalDiapers(year);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load yearly data from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
