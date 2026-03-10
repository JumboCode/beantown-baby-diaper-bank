import Papa from "papaparse";
import { month, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ParsedPartnerRow = {
  partnerName: string;
  totalChildren: string | undefined;
  totalDiapers: string | undefined;
};

export type UploadComputationResult = {
  month: month;
  year: string;
  partnersProcessed: number;
  monthlyRowsCreated: number;
  distributionRowsCreated: number;
  yearlyRowsUpdated: number;
  missingPartners: string[];
};

const MONTHS: month[] = [
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

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function parseNumericCell(cell: string | undefined): number | null {
  if (!cell) return null;
  const normalized = cell.replace(/,/g, "").trim();
  if (!normalized) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// Todo: remove num babies column from parsing logic
export function parsePartnerRows(csv: string): {
  parsed: ParsedPartnerRow[];
} {
  const { data } = Papa.parse<string[]>(csv, { skipEmptyLines: "greedy" });

  const rows = data.slice(1);

  const parsed = rows.map((row) => {
    return {
      partnerName: row[0]?.trim() || "",
      totalChildren: row[1],
      totalDiapers: row[2],
    };
  });

  return { parsed };
}

function monthFromDate(date: Date): month {
  // Use UTC to prevent timezone offsets from shifting month backward/forward.
  return MONTHS[date.getUTCMonth()];
}

async function syncDistributionIdSequence(tx: Prisma.TransactionClient) {
  // Keep Postgres sequence aligned with current max(id) to avoid duplicate id on insert.
  await tx.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Distributions"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Distributions"), 0) + 1,
      false
    );
  `);
}

export async function processDistributionUpload(input: {
  csv: string;
  selectedDate: string;
}): Promise<UploadComputationResult> {
  const { csv, selectedDate } = input;

  const parsedDate = new Date(selectedDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid selectedDate provided.");
  }

  const targetMonth = monthFromDate(parsedDate);
  const targetYear = String(parsedDate.getUTCFullYear());

  const { parsed: partnerRows } = parsePartnerRows(csv);
  if (partnerRows.length === 0) {
    throw new Error("No valid partner rows were found in the uploaded CSV.");
  }

  const partnersWithRegions = await prisma.partner.findMany({
    include: {
      partnerRegions: {
        include: {
          city: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const partnerByName = new Map(
    partnersWithRegions
      .filter((partner) => partner.name)
      .map((partner) => [normalizeName(partner.name as string), partner]),
  );

  const missingPartners = new Set<string>();

  const monthlyRows: Prisma.MonthlyDataCreateManyInput[] = [];
  const distributionRows: Prisma.DistributionCreateManyInput[] = [];

  for (const row of partnerRows) {
    const partner = partnerByName.get(normalizeName(row.partnerName));
    if (!partner) {
      missingPartners.add(row.partnerName);
      continue;
    }

    const totalChildren = parseNumericCell(row.totalChildren);
    const totalDiapers = parseNumericCell(row.totalDiapers);

    if (totalChildren === null || totalDiapers === null) {
      throw new Error(
        `Invalid numeric values for partner "${row.partnerName}" in uploaded CSV.`,
      );
    }

    monthlyRows.push({
      id: crypto.randomUUID(),
      partnerId: partner.id,
      year: targetYear,
      month: targetMonth,
      numDiapers: BigInt(Math.round(totalDiapers)),
      numBabies: BigInt(Math.round(totalChildren)),
    });

    for (const partnerRegion of partner.partnerRegions) {
      const percentage = partnerRegion.percentage ?? 0;
      distributionRows.push({
        partnerId: partner.id,
        cityId: partnerRegion.cityId,
        year: targetYear,
        month: targetMonth,
        percentage,
        numberDiapers: BigInt(Math.round(totalDiapers * percentage)),
        numberChildren: BigInt(Math.round(totalChildren * percentage)),
      });
    }
  }

  let yearlyRowsUpdated = 0;

  await prisma.$transaction(async (tx) => {
    await tx.distribution.deleteMany({
      where: {
        month: targetMonth,
        year: targetYear,
      },
    });

    await tx.monthlyData.deleteMany({
      where: {
        month: targetMonth,
        year: targetYear,
      },
    });

    if (monthlyRows.length > 0) {
      await tx.monthlyData.createMany({
        data: monthlyRows,
      });
    }

    if (distributionRows.length > 0) {
      await syncDistributionIdSequence(tx);
      await tx.distribution.createMany({
        data: distributionRows,
      });
    }

    const yearlyAggregates = await tx.distribution.groupBy({
      by: ["cityId"],
      where: {
        year: targetYear,
        cityId: { not: null },
      },
      _sum: {
        numberDiapers: true,
        numberChildren: true,
      },
    });

    const existingYearly = await tx.yearlyData.findMany({
      where: { year: targetYear },
    });

    const aggregateCityIds = new Set<bigint>();

    for (const aggregate of yearlyAggregates) {
      const cityId = aggregate.cityId;
      if (cityId === null) continue;
      aggregateCityIds.add(cityId);

      const existing = existingYearly.find((row) => row.cityId === cityId);
      const nextNumDiapers = aggregate._sum.numberDiapers ?? BigInt(0);
      const nextNumBabies = aggregate._sum.numberChildren ?? BigInt(0);

      if (existing) {
        await tx.yearlyData.update({
          where: { id: existing.id },
          data: {
            numDiapers: nextNumDiapers,
            numBabies: nextNumBabies,
          },
        });
      } else {
        await tx.yearlyData.create({
          data: {
            id: crypto.randomUUID(),
            cityId,
            year: targetYear,
            numDiapers: nextNumDiapers,
            numBabies: nextNumBabies,
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

    yearlyRowsUpdated = yearlyAggregates.length;
  });

  return {
    month: targetMonth,
    year: targetYear,
    partnersProcessed: monthlyRows.length,
    monthlyRowsCreated: monthlyRows.length,
    distributionRowsCreated: distributionRows.length,
    yearlyRowsUpdated,
    missingPartners: Array.from(missingPartners),
  };
}
