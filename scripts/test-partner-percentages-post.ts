#!/usr/bin/env npx tsx

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const TEST_PARTNER_ID = process.env.TEST_PARTNER_ID ?? "6";
const FLOAT_TOLERANCE = 1e-9;

type PercentageRow = {
  city: string;
  percentage: number;
};

type SnapshotRow = {
  partnerId: bigint;
  cityId: bigint;
  percentage: number | null;
  city: { name: string | null };
};

type TestCase = {
  name: string;
  payload: {
    partnerId: string;
    percentages: PercentageRow[];
  };
  expectedStatus: number;
  expectedSuccess?: boolean;
  expectedError?: string;
  verifyFinalRows?: PercentageRow[];
  expectNoDbChange?: boolean;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeCityName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function nearlyEqual(a: number, b: number, tolerance = FLOAT_TOLERANCE) {
  return Math.abs(a - b) <= tolerance;
}

function serializeRows(rows: SnapshotRow[]) {
  return rows.map((row) => ({
    partnerId: row.partnerId.toString(),
    cityId: row.cityId.toString(),
    city: row.city.name ?? null,
    percentage: row.percentage,
  }));
}

function verifyRowsByCityAndPercentage(
  actualRows: SnapshotRow[],
  expectedRows: PercentageRow[],
  label: string,
) {
  const actual = actualRows
    .map((row) => ({
      city: normalizeCityName(row.city.name),
      percentage: Number(row.percentage ?? 0),
    }))
    .sort((a, b) => a.city.localeCompare(b.city));

  const expected = expectedRows
    .map((row) => ({
      city: normalizeCityName(row.city),
      percentage: Number(row.percentage),
    }))
    .sort((a, b) => a.city.localeCompare(b.city));

  assert(
    actual.length === expected.length,
    `${label}: row count mismatch. 
    expected=${expected.length} actual=${actual.length}`,
  );

  for (let i = 0; i < expected.length; i += 1) {
    assert(
      actual[i].city === expected[i].city,
      `${label}: city mismatch at index ${i}. 
      expected=${expected[i].city} actual=${actual[i].city}`,
    );
    assert(
      nearlyEqual(actual[i].percentage, expected[i].percentage),
      `${label}: percentage mismatch for ${expected[i].city}. 
      expected=${expected[i].percentage} actual=${actual[i].percentage}`,
    );
  }
}

function verifyExactRestore(actualRows: SnapshotRow[], snapshotRows: SnapshotRow[], label: string) {
  const actual = serializeRows(actualRows);
  const expected = serializeRows(snapshotRows);

  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: restored rows do not exactly match snapshot.\n
    Expected: ${JSON.stringify(expected, null, 2)}\n
    Actual: ${JSON.stringify(actual, null, 2)}`,
  );
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { POST } = await import("../src/app/api/partners/percentages/route");

  const TEST_CASES: TestCase[] = [
    {
      name: "Happy path: replace with Boston/Cambridge",
      payload: {
        partnerId: TEST_PARTNER_ID,
        percentages: [
          { city: "Boston", percentage: 0.6 },
          { city: "Cambridge", percentage: 0.4 },
        ],
      },
      expectedStatus: 200,
      expectedSuccess: true,
      verifyFinalRows: [
        { city: "Boston", percentage: 0.6 },
        { city: "Cambridge", percentage: 0.4 },
      ],
    },
    {
      name: "Happy path: add/delete/update with Quincy/Somerville/Medford",
      payload: {
        partnerId: TEST_PARTNER_ID,
        percentages: [
          { city: "Quincy", percentage: 0.34 },
          { city: "Somerville", percentage: 0.33 },
          { city: "Medford", percentage: 0.33 },
        ],
      },
      expectedStatus: 200,
      expectedSuccess: true,
      verifyFinalRows: [
        { city: "Quincy", percentage: 0.34 },
        { city: "Somerville", percentage: 0.33 },
        { city: "Medford", percentage: 0.33 },
      ],
    },
    {
      name: "Reject duplicate city names",
      payload: {
        partnerId: TEST_PARTNER_ID,
        percentages: [
          { city: "Boston", percentage: 0.5 },
          { city: "boston", percentage: 0.5 },
        ],
      },
      expectedStatus: 400,
      expectedError: "Duplicate cities in payload",
      expectNoDbChange: true,
    },
    {
      name: "Reject invalid percentage sum",
      payload: {
        partnerId: TEST_PARTNER_ID,
        percentages: [
          { city: "Boston", percentage: 0.5 },
          { city: "Cambridge", percentage: 0.3 },
        ],
      },
      expectedStatus: 400,
      expectedError: "Percentages must sum to 1",
      expectNoDbChange: true,
    },
    {
      name: "Reject unknown city name",
      payload: {
        partnerId: TEST_PARTNER_ID,
        percentages: [
          { city: "Boston", percentage: 0.5 },
          { city: "Atlantis", percentage: 0.5 },
        ],
      },
      expectedStatus: 400,
      expectedError: "One or more payload cities not found in DB",
      expectNoDbChange: true,
    },
  ];

  async function fetchPartnerRegionRows(partnerId: string) {
    return prisma.partnerRegion.findMany({
      where: { partnerId: BigInt(partnerId) },
      select: {
        partnerId: true,
        cityId: true,
        percentage: true,
        city: { select: { name: true } },
      },
      orderBy: [{ cityId: "asc" }],
    });
  }

  async function ensurePartnerExists(partnerId: string) {
    const partner = await prisma.partner.findUnique({
      where: { id: BigInt(partnerId) },
      select: { id: true, name: true },
    });

    assert(
      partner,
      `Partner ${partnerId} not found. Set TEST_PARTNER_ID to an 
      existing partner before running this script.`,
    );
  }

  async function invokePost(payload: TestCase["payload"]) {
    const request = new Request("http://local.test/api/partners/percentages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

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

  async function restorePartnerRegions(partnerId: string, snapshotRows: SnapshotRow[]) {
    await prisma.$transaction(async (tx) => {
      await tx.partnerRegion.deleteMany({
        where: { partnerId: BigInt(partnerId) },
      });

      if (snapshotRows.length > 0) {
        await tx.partnerRegion.createMany({
          data: snapshotRows.map((row) => ({
            partnerId: row.partnerId,
            cityId: row.cityId,
            percentage: row.percentage,
          })),
        });
      }
    });
  }

  async function runTestCase(testCase: TestCase) {
    console.log(`\n=== ${testCase.name} ===`);

    const snapshotRows = await fetchPartnerRegionRows(testCase.payload.partnerId);

    try {
      const response = await invokePost(testCase.payload);

      assert(
        response.status === testCase.expectedStatus,
        `${testCase.name}: expected status ${testCase.expectedStatus}, 
        got ${response.status}\nResponse: ${JSON.stringify(response.json, null, 2)}`,
      );

      const responseJson = response.json as {
        success?: boolean;
        message?: string;
        error?: string;
      } | null;

      if (typeof testCase.expectedSuccess === "boolean") {
        assert(
          responseJson?.success === testCase.expectedSuccess,
          `${testCase.name}: success mismatch. expected=${testCase.expectedSuccess} 
          actual=${responseJson?.success}`,
        );
      }

      if (testCase.expectedError) {
        assert(
          responseJson?.error === testCase.expectedError,
          `${testCase.name}: error mismatch. expected="${testCase.expectedError}" 
          actual="${responseJson?.error}"`,
        );
      }

      const finalRows = await fetchPartnerRegionRows(testCase.payload.partnerId);

      if (testCase.verifyFinalRows) {
        verifyRowsByCityAndPercentage(
          finalRows,
          testCase.verifyFinalRows,
          `${testCase.name} final-state rows`,
        );
      }

      if (testCase.expectNoDbChange) {
        verifyExactRestore(finalRows, snapshotRows, `${testCase.name} no-change check`);
      }

      console.log(`PASS ${testCase.name}`);
    } finally {
      await restorePartnerRegions(testCase.payload.partnerId, snapshotRows);

      const restoredRows = await fetchPartnerRegionRows(testCase.payload.partnerId);
      verifyExactRestore(restoredRows, snapshotRows, `${testCase.name} restore-check`);

      console.log(`RESTORED ${testCase.name}`);
    }
  }

  await ensurePartnerExists(TEST_PARTNER_ID);

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
