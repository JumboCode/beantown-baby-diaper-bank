import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { month, Prisma } from "@/generated/prisma/client";
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
    const result = await prisma.$transaction(async (tx) => {
      const existingRows = await tx.monthlyData.findMany({
        where: {
          partnerId,
          year: body.year,
          month: body.month,
        },
        orderBy: { id: "asc" },
      });

      const primaryRow = existingRows[0];
      const nextNumDiapers =
        body.numDiapers === undefined
          ? primaryRow?.numDiapers ?? null
          : body.numDiapers === null
            ? null
            : BigInt(body.numDiapers);
      const nextNumBabies =
        body.numBabies === undefined
          ? primaryRow?.numBabies ?? null
          : body.numBabies === null
            ? null
            : BigInt(body.numBabies);

      let savedRow;

      if (primaryRow) {
        savedRow = await tx.monthlyData.update({
          where: { id: primaryRow.id },
          data: {
            numDiapers: nextNumDiapers,
            numBabies: nextNumBabies,
          },
          include: {
            partner: { select: { name: true } },
          },
        });

        if (existingRows.length > 1) {
          await tx.monthlyData.deleteMany({
            where: {
              id: {
                in: existingRows.slice(1).map((row) => row.id),
              },
            },
          });
        }
      } else {
        savedRow = await tx.monthlyData.create({
          data: {
            id: crypto.randomUUID(),
            partnerId,
            year: body.year,
            month: body.month,
            numDiapers: nextNumDiapers,
            numBabies: nextNumBabies,
          },
          include: {
            partner: { select: { name: true } },
          },
        });
      }

      const existingDistributions = await tx.distribution.findMany({
        where: {
          partnerId,
          year: body.year,
          month: body.month,
        },
        orderBy: { id: "asc" },
      });

      // selects all the cities that are included under (pId, year, month) combo
      const distributionSeedRows =
        existingDistributions.length > 0
          ? existingDistributions.map((dist) => ({
              cityId: dist.cityId,
              percentage: dist.percentage,
            }))
          : await tx.partnerRegion.findMany({
              where: { partnerId },
              select: {
                cityId: true,
                percentage: true,
              },
              orderBy: { cityId: "asc" },
            });
      const normalizedSeedRows = distributionSeedRows.map((row) => ({
        cityId: row.cityId,
        percentage: row.percentage ?? 0,
      }));
      const diapersArr =
        nextNumDiapers === null
          ? null
          : allocateLargestRemainder(
              Number(nextNumDiapers),
              normalizedSeedRows.map((row) => row.percentage),
            );

      if (existingDistributions.length > 0) {
        await tx.distribution.deleteMany({
          where: {
            id: {
              in: existingDistributions.map((dist) => dist.id),
            },
          },
        });
      }

      if (normalizedSeedRows.length > 0) {
        await tx.distribution.createMany({
          data: normalizedSeedRows.map((row, idx) => ({
            partnerId,
            cityId: row.cityId,
            year: body.year,
            month: body.month,
            percentage: row.percentage,
            numberDiapers:
              nextNumDiapers === null
                ? null
                : BigInt(diapersArr![idx]),
            numberChildren:
              nextNumBabies === null
                ? null
                : BigInt(
                    Math.round(Number(nextNumBabies) * row.percentage),
                  ),
          })),
        });
      }

      const updatedDistributions = await tx.distribution.findMany({
        where: {
          partnerId,
          year: body.year,
          month: body.month,
        },
        include: {
          partner: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const yearlyAggregates = await tx.distribution.groupBy({
        by: ["cityId"],
        where: {
          year: body.year,
          cityId: { not: null },
        },
        _sum: {
          numberDiapers: true,
          numberChildren: true,
        },
      });

      const existingYearly = await tx.yearlyData.findMany({
        where: { year: body.year },
      });

      const aggregateCityIds = new Set<bigint>();

      for (const aggregate of yearlyAggregates) {
        const cityId = aggregate.cityId;
        if (cityId === null) continue;
        aggregateCityIds.add(cityId);

        const existing = existingYearly.find((row) => row.cityId === cityId);
        const nextYearlyDiapers = aggregate._sum.numberDiapers ?? BigInt(0);
        const nextYearlyBabies = aggregate._sum.numberChildren ?? BigInt(0);

        if (existing) {
          await tx.yearlyData.update({
            where: { id: existing.id },
            data: {
              numDiapers: nextYearlyDiapers,
              numBabies: nextYearlyBabies,
            },
          });
        } else {
          await tx.yearlyData.create({
            data: {
              id: crypto.randomUUID(),
              cityId,
              year: body.year,
              numDiapers: nextYearlyDiapers,
              numBabies: nextYearlyBabies,
            },
          });
        }
      }

      const staleYearlyIds = existingYearly
        .filter((row) => !aggregateCityIds.has(row.cityId))
        .map((row) => row.id);

      if (staleYearlyIds.length > 0) {
        await tx.yearlyData.deleteMany({
          where: { id: { in: staleYearlyIds } },
        });
      }

      return {
        savedRow,
        updatedDistributions,
      };
    });

    return NextResponse.json(
      {
        message: "Monthly Data updated successfully",
        data: {
          id: result.savedRow.id,
          partnerId: result.savedRow.partnerId.toString(),
          year: result.savedRow.year,
          month: result.savedRow.month,
          numberDiapers: result.savedRow.numDiapers?.toString() ?? null,
          numBabies: result.savedRow.numBabies?.toString() ?? null,
          partner: result.savedRow.partner,
        },
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
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "An error occurred while updating Monthly Data" },
      { status: 500 },
    );
  }
}
