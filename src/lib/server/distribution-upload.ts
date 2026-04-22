import Papa from "papaparse";
import { month, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { allocateLargestRemainder } from "@/lib/server/distribution-update";

type ParsedPartnerRow = {
  partnerName: string;
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
      totalDiapers: row[1],
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

function getDiceCoefficient(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams1.get(bigram);
    if (count && count > 0) {
      bigrams1.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (s1.length - 1 + s2.length - 1);
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

  const partnersInfo = partnersWithRegions
    .filter((partner) => partner.name)
    .map((partner) => ({
      normalizedName: normalizeName(partner.name as string),
      partner,
    }));

  const missingPartners = new Set<string>();

  const monthlyRows: Prisma.MonthlyDataCreateManyInput[] = [];
  const distributionRows: Prisma.DistributionCreateManyInput[] = [];

  const FUZZY_THRESHOLD = 0.6;

  for (const row of partnerRows) {
    const searchName = normalizeName(row.partnerName);
    let bestMatch = null;
    let highestScore = 0;

    // Fast path: exact match
    const exactMatch = partnersInfo.find((p) => p.normalizedName === searchName);
    if (exactMatch) {
      bestMatch = exactMatch.partner;
      highestScore = 1.0;
    } else {
      // Fallback: Fuzzy match using Dice coefficient
      for (const info of partnersInfo) {
        const score = getDiceCoefficient(searchName, info.normalizedName);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = info.partner;
        }
      }
    }

    if (!bestMatch || highestScore < FUZZY_THRESHOLD) {
      missingPartners.add(row.partnerName);
      continue;
    }

    const partner = bestMatch;

    const totalDiapers = parseNumericCell(row.totalDiapers);

    if (totalDiapers === null) {
      throw new Error(`Invalid numeric values for partner "${row.partnerName}" in uploaded CSV.`);
    }

    const roundedTotalDiapers = Math.round(totalDiapers);
    monthlyRows.push({
      id: crypto.randomUUID(),
      partnerId: partner.id,
      year: targetYear,
      month: targetMonth,
      numDiapers: BigInt(roundedTotalDiapers),
    });

    const normalizedPartnerRegions = [...partner.partnerRegions]
      .sort((a, b) => Number(a.cityId - b.cityId))
      .map((partnerRegion) => ({
        cityId: partnerRegion.cityId,
        percentage: partnerRegion.percentage ?? 0,
      }));

    const diaperArr = allocateLargestRemainder(
      roundedTotalDiapers,
      normalizedPartnerRegions.map((partnerRegion) => partnerRegion.percentage),
    );

    for (const [idx, partnerRegion] of normalizedPartnerRegions.entries()) {
      distributionRows.push({
        partnerId: partner.id,
        cityId: partnerRegion.cityId,
        year: targetYear,
        month: targetMonth,
        percentage: partnerRegion.percentage,
        numberDiapers: BigInt(diaperArr[idx]),
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
