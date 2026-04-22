import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { estimateBabiesHelped, MonthlyDistributionTotal } from "@/lib/estimateBabies";

async function getTotalDiapers(year: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  if (year) {
    const [cumulativeResults, yearlyResults, monthlyDistributions] = await Promise.all([
      prisma.yearlyData.aggregate({
        where: { year: { lte: year } },
        _sum: { numDiapers: true },
      }),
      prisma.yearlyData.aggregate({
        where: { year },
        _sum: { numDiapers: true },
      }),
      prisma.distribution.groupBy({
        by: ["month"],
        where: { year },
        _sum: {
          numberDiapers: true,
          numberChildren: true,
        },
      }),
    ]);

    const totalDiapers =
      cumulativeResults._sum.numDiapers == null ? 0 : Number(cumulativeResults._sum.numDiapers);
    const yearlyTotalDiapers =
      yearlyResults._sum.numDiapers == null ? 0 : Number(yearlyResults._sum.numDiapers);

    const monthlyTotals: MonthlyDistributionTotal[] = monthlyDistributions
      .filter((m) => m.month != null)
      .map((m) => ({
        month: String(m.month),
        diapers: Number(m._sum.numberDiapers ?? 0),
        children: m._sum.numberChildren != null ? Number(m._sum.numberChildren) : null,
      }));

    // yearlyTotalDiapers (from YearlyData) is used as the fallback when no monthly Distribution rows exist
    const babiesHelped = estimateBabiesHelped(monthlyTotals, yearlyTotalDiapers);

    return { totalDiapers, yearlyTotalDiapers, babiesHelped };
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
