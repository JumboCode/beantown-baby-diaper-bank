import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { month, Prisma as PrismaTypes } from "@/generated/prisma/client";
import { revalidateTag } from "next/cache";
import { allocateLargestRemainder } from "@/lib/server/distribution-update";

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

  const startMonth: month | null = searchParams.get("startMonth") as month | null;
  const endMonth: month | null = searchParams.get("endMonth") as month | null;

  let where: PrismaTypes.DistributionWhereInput = {};

  if (startMonth && startYear && endMonth && endYear) {
    const sYear = parseInt(startYear);
    const eYear = parseInt(endYear);
    const sMonthIdx = MONTH_NAMES.indexOf(startMonth);
    const eMonthIdx = MONTH_NAMES.indexOf(endMonth);

    if (sYear === eYear) {
      const monthsInRange: month[] = MONTH_NAMES.slice(sMonthIdx, eMonthIdx + 1) as month[];
      where = {
        year: startYear,
        month: { in: monthsInRange },
      };
    } else {
      const startYearMonths: month[] = MONTH_NAMES.slice(sMonthIdx) as month[];
      const endYearMonths: month[] = MONTH_NAMES.slice(0, eMonthIdx + 1) as month[];

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
    if (month) {
    // return rows for month if requested
    where = {
      month,
      ...(year ? { year } : {}),
    };
  } else if (year) {
    // if no month data, return year
    where = {
      year,
      month: null,
    };
  }
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
    const distributionsArr = await prisma.distribution.findMany(distributionsQuery);

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
    return NextResponse.json({ error: "Failed to fetch distributions" }, { status: 500 });
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

    const toDelete = await prisma.distribution.findMany({
      where: { id: { in: parsedIds } },
      select: {
        partnerId: true,
        cityId: true,
        year: true,
        month: true,
        numberDiapers: true,
        numberChildren: true,
      },
    });

    const monthlyDataKeys = [
      ...new Map(
        toDelete
          .filter((d) => d.partnerId && d.year && d.month)
          .map((d) => [`${d.partnerId}-${d.year}-${d.month}`, d]),
      ).values(),
    ] as { partnerId: bigint; year: string; month: string }[];

    const yearlyTotals = new Map<
      string,
      { cityId: bigint; year: string; diapers: bigint; children: bigint }
    >();
    for (const d of toDelete) {
      if (!d.cityId || !d.year) continue;
      const key = `${d.cityId}-${d.year}`;
      const existing = yearlyTotals.get(key) ?? {
        cityId: d.cityId,
        year: d.year,
        diapers: BigInt(0),
        children: BigInt(0),
      };
      existing.diapers += d.numberDiapers ?? BigInt(0);
      existing.children += d.numberChildren ?? BigInt(0);
      yearlyTotals.set(key, existing);
    }

    const [result] = await prisma.$transaction([
      prisma.distribution.deleteMany({
        where: { id: { in: parsedIds } },
      }),
      ...monthlyDataKeys.map(({ partnerId, year, month }) =>
        prisma.monthlyData.deleteMany({
          where: { partnerId, year, month: month as never },
        }),
      ),
      ...[...yearlyTotals.values()].map(({ cityId, year, diapers, children }) =>
        prisma.yearlyData.updateMany({
          where: { cityId, year },
          data: {
            numDiapers: { decrement: diapers },
            numBabies: { decrement: children },
          },
        }),
      ),
    ]);

    revalidateTag("cities", "max");

    return NextResponse.json({ deletedCount: result.count });
  } catch (error) {
    console.error("Error deleting distributions:", error);
    return NextResponse.json({ error: "Failed to delete distributions" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { partnerId, year, numDiapers } = body as {
      partnerId: string | number;
      year: string;
      numDiapers: number | null;
    };

    const partnerIdBig = BigInt(partnerId);
    // The Math.round() here should be fine since numDiapers is int
    const numDiapersBig = numDiapers === null ? null : BigInt(Math.round(Number(numDiapers)));

    const result = await prisma.$transaction(async (tx) => {
      const existingDistributions = await tx.distribution.findMany({
        where: { partnerId: partnerIdBig, year: String(year), month: null },
        orderBy: { id: "asc" },
      });

      const seedRows =
        existingDistributions.length > 0
          ? existingDistributions.map((d) => ({ cityId: d.cityId, percentage: d.percentage }))
          : await tx.partnerRegion.findMany({
              where: { partnerId: partnerIdBig },
              select: { cityId: true, percentage: true },
              orderBy: { cityId: "asc" },
            });
      const normalizedSeedRows = seedRows.map((row) => ({
        cityId: row.cityId,
        percentage: row.percentage ?? 0,
      }));
      const diapersArr =
        numDiapersBig === null
          ? null
          : allocateLargestRemainder(
              Number(numDiapersBig),
              normalizedSeedRows.map((row) => row.percentage),
            );

      if (existingDistributions.length > 0) {
        await tx.distribution.deleteMany({
          where: { id: { in: existingDistributions.map((d) => d.id) } },
        });
      }

      if (normalizedSeedRows.length > 0) {
        await tx.distribution.createMany({
          data: normalizedSeedRows.map((row, idx) => ({
            partnerId: partnerIdBig,
            cityId: row.cityId,
            year: String(year),
            month: null,
            percentage: row.percentage,
            numberDiapers:
              numDiapersBig === null
                ? null
                : BigInt(diapersArr![idx]),
          })),
        });
      }

      const yearlyAggregates = await tx.distribution.groupBy({
        by: ["cityId"],
        where: { year: String(year), cityId: { not: null } },
        _sum: { numberDiapers: true, numberChildren: true },
      });

      const existingYearly = await tx.yearlyData.findMany({ where: { year: String(year) } });
      const aggregateCityIds = new Set<bigint>();

      for (const agg of yearlyAggregates) {
        const cityId = agg.cityId;
        if (!cityId) continue;
        aggregateCityIds.add(cityId);
        const existing = existingYearly.find((r) => r.cityId === cityId);
        const nextDiapers = agg._sum.numberDiapers ?? BigInt(0);
        const nextBabies = agg._sum.numberChildren ?? BigInt(0);
        if (existing) {
          await tx.yearlyData.update({
            where: { id: existing.id },
            data: { numDiapers: nextDiapers, numBabies: nextBabies },
          });
        } else {
          await tx.yearlyData.create({
            data: {
              id: crypto.randomUUID(),
              cityId,
              year: String(year),
              numDiapers: nextDiapers,
              numBabies: nextBabies,
            },
          });
        }
      }

      const staleIds = existingYearly
        .filter((r) => !aggregateCityIds.has(r.cityId))
        .map((r) => r.id);
      if (staleIds.length > 0) {
        await tx.yearlyData.deleteMany({ where: { id: { in: staleIds } } });
      }

      const updatedDistributions = await tx.distribution.findMany({
        where: { partnerId: partnerIdBig, year: String(year), month: null },
        include: {
          partner: { select: { name: true } },
          city: { select: { name: true } },
        },
      });

      return { updatedDistributions };
    });

    revalidateTag("cities", "max");

    return NextResponse.json({
      message: "Yearly distributions updated successfully",
      totalDiapers: numDiapers,
      distributions: result.updatedDistributions.map((dist) => ({
        id: dist.id.toString(),
        partnerId: dist.partnerId?.toString() ?? null,
        cityId: dist.cityId?.toString() ?? null,
        year: dist.year,
        month: dist.month,
        numberDiapers: dist.numberDiapers?.toString() ?? null,
        numberChildren: dist.numberChildren?.toString() ?? null,
        percentage: dist.percentage,
        partner: dist.partner,
        city: dist.city,
      })),
    });
  } catch (error) {
    console.error("Error updating yearly distributions:", error);
    return NextResponse.json({ error: "Failed to update yearly distributions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { partnerId, month: monthName, year, percentages } = body;

    // validate
    if (!partnerId || !monthName || !Number.isInteger(year) || !Array.isArray(percentages)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const targetMonth = monthName as month;
    if (!Object.values(month).includes(targetMonth)) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    if (percentages.some((item) => !item.city || item.percentage < 0)) {
      return NextResponse.json({ error: "Invalid city or percentage" }, { status: 400 });
    }

    const uniqueCities = new Set(percentages.map((item) => item.city));
    if (uniqueCities.size !== percentages.length) {
      return NextResponse.json({ error: "Duplicate cities in payload" }, { status: 400 });
    }

    const totalPercentage = percentages.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 1) > 1e-9) {
      return NextResponse.json({ error: "Percentages must sum up to 100%" }, { status: 400 });
    }

    const res = await prisma.$transaction(async (tx) => {
      const monthlyRows = await tx.monthlyData.findMany({
        where: {
          partnerId: BigInt(partnerId),
          year: String(year),
          month: targetMonth,
        },
        select: { id: true, numDiapers: true },
      });
      if (monthlyRows.length !== 1) {
        throw new Error("Expected unique (partner, year, month) combo");
      }
      const monthly = monthlyRows[0];

      const cities = await tx.city.findMany({
        where: { name: { in: [...uniqueCities] } },
        select: { id: true, name: true },
      });
      if (cities.length !== uniqueCities.size) {
        throw new Error("One or more payload cities not found in DB");
      }
      // Since the payload doesn't include cityId, but our distributions table
      // only has cityId and not cityName, we must connect them explicitly
      const cityIdByName = new Map(cities.map((city) => [city.name, city.id]));

      // total numDiapers does not change across one-time update, and should
      // be used to calculate the latest diaper distributions based on the
      // updated percentages
      const totalDiapers = Number(monthly.numDiapers);
      const diaperAllocations = allocateLargestRemainder(
        totalDiapers,
        percentages.map((item) => item.percentage),
      );

      // Full replace for the whole scope instead of selective delete + upsert
      await tx.distribution.deleteMany({
        where: {
          partnerId: BigInt(partnerId),
          year: String(year),
          month: targetMonth,
        },
      });

      if (percentages.length > 0) {
        await tx.distribution.createMany({
          data: percentages.map((item, idx) => ({
            partnerId: BigInt(partnerId),
            cityId: cityIdByName.get(item.city),
            year: String(year),
            month: targetMonth,
            percentage: item.percentage,
            numberDiapers: diaperAllocations[idx],
          })),
        });
      }

      return { rowsCreated: percentages.length };
    });

    return NextResponse.json({
      success: true,
      message: "Distributions updated successfully",
      ...res,
    });
  } catch (error) {
    console.error("Error updating distributions:", error);
    return NextResponse.json({ error: "Failed to update distributions" }, { status: 500 });
  }
}
