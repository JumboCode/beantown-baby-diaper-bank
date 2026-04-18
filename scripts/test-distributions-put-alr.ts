#!/usr/bin/env npx tsx

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

type TestCase = {
  name: string;
  partnerName: string;
  partnerId: string;
  year: string;
  numDiapers: number;
};

type DistributionSnapshotRow = {
  id: bigint;
  createdAt: Date;
  partnerId: bigint | null;
  cityId: bigint | null;
  year: string | null;
  month: null | string;
  numberDiapers: bigint | null;
  numberChildren: bigint | null;
  percentage: number | null;
  city: { name: string | null } | null;
};

type YearlySnapshotRow = {
  id: string;
  cityId: bigint;
  year: string;
  numDiapers: bigint | null;
  numBabies: bigint | null;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeCityName(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function serializeDistributionRows(rows: DistributionSnapshotRow[]) {
  return rows.map((row) => ({
    id: row.id.toString(),
    createdAt: row.createdAt.toISOString(),
    partnerId: row.partnerId?.toString() ?? null,
    cityId: row.cityId?.toString() ?? null,
    year: row.year,
    month: row.month,
    numberDiapers: row.numberDiapers?.toString() ?? null,
    numberChildren: row.numberChildren?.toString() ?? null,
    percentage: row.percentage,
    city: row.city?.name ?? null,
  }));
}

function serializeYearlyRows(rows: YearlySnapshotRow[]) {
  return rows.map((row) => ({
    id: row.id,
    cityId: row.cityId.toString(),
    year: row.year,
    numDiapers: row.numDiapers?.toString() ?? null,
    numBabies: row.numBabies?.toString() ?? null,
  }));
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { PUT } = await import("../src/app/api/distributions/route");
  const { allocateLargestRemainder } = await import(
    "../src/lib/server/distribution-update"
  );

  const TEST_CASES: TestCase[] = [
    {
      name: "Family ACCESS yearly PUT uses ALR instead of under-by-2 rounding",
      partnerName: "Family ACCESS",
      partnerId: "3",
      year: "2026",
      numDiapers: 6944,
    },
    {
      name: "MHSA yearly PUT uses ALR instead of over-by-1 rounding",
      partnerName: "Middlesex Human Service Agency (MHSA)",
      partnerId: "6",
      year: "2026",
      numDiapers: 4986,
    },
  ];

  async function ensurePartnerExists(testCase: TestCase) {
    const partner = await prisma.partner.findUnique({
      where: { id: BigInt(testCase.partnerId) },
      select: { id: true, name: true },
    });

    assert(
      partner?.name === testCase.partnerName,
      `${testCase.name}: expected partner ${testCase.partnerName} with id ${testCase.partnerId}`,
    );
  }

  async function fetchDistributionRows(testCase: TestCase) {
    return prisma.distribution.findMany({
      where: {
        partnerId: BigInt(testCase.partnerId),
        year: testCase.year,
        month: null,
      },
      select: {
        id: true,
        createdAt: true,
        partnerId: true,
        cityId: true,
        year: true,
        month: true,
        numberDiapers: true,
        numberChildren: true,
        percentage: true,
        city: { select: { name: true } },
      },
      orderBy: { id: "asc" },
    });
  }

  async function fetchPartnerRegionRows(partnerId: string) {
    return prisma.partnerRegion.findMany({
      where: { partnerId: BigInt(partnerId) },
      select: {
        cityId: true,
        percentage: true,
        city: { select: { name: true } },
      },
      orderBy: { cityId: "asc" },
    });
  }

  async function fetchYearlyRows(year: string, cityIds: bigint[]) {
    if (cityIds.length === 0) return [];

    return prisma.yearlyData.findMany({
      where: {
        year,
        cityId: { in: cityIds },
      },
      orderBy: { id: "asc" },
    });
  }

  async function invokePut(testCase: TestCase) {
    const request = new Request("http://local.test/api/distributions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        partnerId: testCase.partnerId,
        year: testCase.year,
        numDiapers: testCase.numDiapers,
      }),
    });

    const response = await PUT(request);

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    return {
      status: response.status,
      ok: response.ok,
      json,
    };
  }

  function buildExpectedAllocationMap(
    total: number,
    seedRows: Array<{ cityId: bigint; percentage: number | null }>,
  ) {
    const normalizedSeedRows = seedRows.map((row) => ({
      cityId: row.cityId,
      percentage: row.percentage ?? 0,
    }));

    const allocations = allocateLargestRemainder(
      total,
      normalizedSeedRows.map((row) => row.percentage),
    );

    return new Map(
      normalizedSeedRows.map((row, index) => [row.cityId.toString(), allocations[index]]),
    );
  }

  function verifyDistributionAllocations(
    label: string,
    actualRows: DistributionSnapshotRow[],
    expectedMap: Map<string, number>,
    total: number,
  ) {
    const actualTotal = actualRows.reduce(
      (sum, row) => sum + Number(row.numberDiapers ?? BigInt(0)),
      0,
    );

    assert(
      actualTotal === total,
      `${label}: total diapers mismatch. expected=${total} actual=${actualTotal}`,
    );

    for (const row of actualRows) {
      const cityId = row.cityId?.toString();
      assert(cityId, `${label}: encountered row with null cityId`);

      const expected = expectedMap.get(cityId);
      assert(
        expected !== undefined,
        `${label}: unexpected city in final distributions: ${cityId}`,
      );

      assert(
        Number(row.numberDiapers ?? BigInt(0)) === expected,
        `${label}: numberDiapers mismatch for ${normalizeCityName(
          row.city?.name,
        )}. expected=${expected} actual=${String(row.numberDiapers ?? BigInt(0))}`,
      );
    }
  }

  function verifyExactRestore(
    label: string,
    actualDistributionRows: DistributionSnapshotRow[],
    expectedDistributionRows: DistributionSnapshotRow[],
    actualYearlyRows: YearlySnapshotRow[],
    expectedYearlyRows: YearlySnapshotRow[],
  ) {
    assert(
      JSON.stringify(serializeDistributionRows(actualDistributionRows)) ===
        JSON.stringify(serializeDistributionRows(expectedDistributionRows)),
      `${label}: yearly distribution rows were not restored exactly`,
    );

    assert(
      JSON.stringify(serializeYearlyRows(actualYearlyRows)) ===
        JSON.stringify(serializeYearlyRows(expectedYearlyRows)),
      `${label}: yearly aggregate rows were not restored exactly`,
    );
  }

  async function restoreState(
    testCase: TestCase,
    distributionRows: DistributionSnapshotRow[],
    yearlyRows: YearlySnapshotRow[],
    cityIds: bigint[],
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.distribution.deleteMany({
        where: {
          partnerId: BigInt(testCase.partnerId),
          year: testCase.year,
          month: null,
        },
      });

      if (distributionRows.length > 0) {
        await tx.distribution.createMany({
          data: distributionRows.map((row) => ({
            id: row.id,
            createdAt: row.createdAt,
            partnerId: row.partnerId,
            cityId: row.cityId,
            year: row.year,
            month: null,
            numberDiapers: row.numberDiapers,
            numberChildren: row.numberChildren,
            percentage: row.percentage,
          })),
        });
      }

      if (cityIds.length > 0) {
        await tx.yearlyData.deleteMany({
          where: {
            year: testCase.year,
            cityId: { in: cityIds },
          },
        });
      }

      if (yearlyRows.length > 0) {
        await tx.yearlyData.createMany({
          data: yearlyRows.map((row) => ({
            id: row.id,
            cityId: row.cityId,
            year: row.year,
            numDiapers: row.numDiapers,
            numBabies: row.numBabies,
          })),
        });
      }
    });
  }

  async function runTestCase(testCase: TestCase) {
    console.log(`\n=== ${testCase.name} ===`);

    await ensurePartnerExists(testCase);

    const beforeDistributionRows = await fetchDistributionRows(testCase);
    const partnerRegionRows = await fetchPartnerRegionRows(testCase.partnerId);

    const seedRows =
      beforeDistributionRows.length > 0
        ? beforeDistributionRows.map((row) => ({
            cityId: row.cityId!,
            percentage: row.percentage,
          }))
        : partnerRegionRows.map((row) => ({
            cityId: row.cityId,
            percentage: row.percentage,
          }));

    const affectedCityIds = [
      ...new Set(seedRows.map((row) => row.cityId.toString())),
    ].map((value) => BigInt(value));

    const beforeYearlyRows = await fetchYearlyRows(testCase.year, affectedCityIds);

    try {
      const beforeTotal = beforeDistributionRows.reduce(
        (sum, row) => sum + Number(row.numberDiapers ?? BigInt(0)),
        0,
      );
      console.log(`Before PUT total=${beforeTotal}, target=${testCase.numDiapers}`);

      const response = await invokePut(testCase);
      const afterDistributionRows = await fetchDistributionRows(testCase);
      const expectedMap = buildExpectedAllocationMap(testCase.numDiapers, seedRows);

      assert(
        afterDistributionRows.length === seedRows.length,
        `${testCase.name}: distribution row count mismatch. expected=${seedRows.length} actual=${afterDistributionRows.length}`,
      );

      verifyDistributionAllocations(
        testCase.name,
        afterDistributionRows,
        expectedMap,
        testCase.numDiapers,
      );

      const responseJson = response.json as { error?: string; message?: string } | null;
      if (response.status !== 200) {
        assert(
          response.status === 500 &&
            responseJson?.error === "Failed to update yearly distributions",
          `${testCase.name}: unexpected response status ${response.status}\nResponse: ${JSON.stringify(
            response.json,
            null,
            2,
          )}`,
        );
        console.log(
          `Note: route returned 500 after DB success because direct script invocation does not provide Next's revalidateTag runtime.`,
        );
      }

      console.log(`PASS ${testCase.name}`);
    } finally {
      await restoreState(
        testCase,
        beforeDistributionRows,
        beforeYearlyRows,
        affectedCityIds,
      );

      const restoredDistributionRows = await fetchDistributionRows(testCase);
      const restoredYearlyRows = await fetchYearlyRows(testCase.year, affectedCityIds);

      verifyExactRestore(
        `${testCase.name} restore-check`,
        restoredDistributionRows,
        beforeDistributionRows,
        restoredYearlyRows,
        beforeYearlyRows,
      );

      console.log(`RESTORED ${testCase.name}`);
    }
  }

  let passed = 0;

  for (const testCase of TEST_CASES) {
    try {
      await runTestCase(testCase);
      passed += 1;
    } catch (error) {
      console.error(`FAIL ${testCase.name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }

  console.log(`\n${passed}/${TEST_CASES.length} test cases passed`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
