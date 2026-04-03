import { config as loadEnv } from "dotenv";
import { type month as MonthName } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const FLOAT_TOLERANCE = 1e-9;

type Scope = {
  partnerId: string;
  month: MonthName;
  year: number;
};

type PercentageRow = {
  city: string;
  percentage: number;
};

type Payload = Scope & {
  percentages: PercentageRow[];
};

type SnapshotRow = {
  id: bigint;
  createdAt: Date;
  partnerId: bigint | null;
  cityId: bigint | null;
  year: string | null;
  month: MonthName | null;
  numberDiapers: bigint | null;
  numberChildren: bigint | null;
  percentage: number | null;
  city: { name: string | null } | null;
};

const ORIGINAL_ROWS: PercentageRow[] = [
  { city: "Dorchester", percentage: 0.03 },
  { city: "Mattapan", percentage: 0.02 },
  { city: "Waltham", percentage: 0.95 },
];

const TEST_CASES: Array<{
  name: string;
  scope: Scope;
  expectedStartingRows: PercentageRow[];
  payload: Payload;
}> = [
  {
    name: "March 2026: keep all cities, only add percentages",
    scope: { partnerId: "6", month: "March", year: 2026 },
    expectedStartingRows: ORIGINAL_ROWS,
    payload: {
      partnerId: "6",
      month: "March",
      year: 2026,
      percentages: [
        { city: "Waltham", percentage: 0.7 },
        { city: "Dorchester", percentage: 0.2 },
        { city: "Mattapan", percentage: 0.1 },
      ],
    },
  },
  {
    name: "March 2026: keep Waltham, delete Dorchester/Mattapan, add Boston/Cambridge",
    scope: { partnerId: "6", month: "March", year: 2026 },
    expectedStartingRows: ORIGINAL_ROWS,
    payload: {
      partnerId: "6",
      month: "March",
      year: 2026,
      percentages: [
        { city: "Waltham", percentage: 0.6 },
        { city: "Boston", percentage: 0.2 },
        { city: "Cambridge", percentage: 0.2 },
      ],
    },
  },
  {
    name: "October 2025: full replace with Quincy/Somerville/Medford",
    scope: { partnerId: "6", month: "October", year: 2025 },
    expectedStartingRows: ORIGINAL_ROWS,
    payload: {
      partnerId: "6",
      month: "October",
      year: 2025,
      percentages: [
        { city: "Quincy", percentage: 0.34 },
        { city: "Somerville", percentage: 0.33 },
        { city: "Medford", percentage: 0.33 },
      ],
    },
  },
];

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { allocateLargestRemainder } = await import("../src/lib/server/distribution-update");

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
      id: row.id.toString(),
      createdAt: row.createdAt.toISOString(),
      partnerId: row.partnerId?.toString() ?? null,
      cityId: row.cityId?.toString() ?? null,
      city: row.city?.name ?? null,
      year: row.year,
      month: row.month,
      percentage: row.percentage,
      numberDiapers: row.numberDiapers?.toString() ?? null,
      numberChildren: row.numberChildren?.toString() ?? null,
    }));
  }

  function verifyRowsByCityAndPercentage(
    actualRows: SnapshotRow[],
    expectedRows: PercentageRow[],
    label: string,
  ) {
    const actual = actualRows
      .map((row) => ({
        city: normalizeCityName(row.city?.name),
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
      `${label}: row count mismatch. expected=${expected.length} actual=${actual.length}`,
    );

    for (let i = 0; i < expected.length; i += 1) {
      assert(
        actual[i].city === expected[i].city,
        `${label}: city mismatch at index ${i}. expected=${expected[i].city} actual=${actual[i].city}`,
      );
      assert(
        nearlyEqual(actual[i].percentage, expected[i].percentage),
        `${label}: percentage mismatch for ${expected[i].city}.
        expected=${expected[i].percentage}
        actual=${actual[i].percentage}`,
      );
    }
  }

  function verifyExactRestore(
    actualRows: SnapshotRow[],
    snapshotRows: SnapshotRow[],
    label: string,
  ) {
    const actual = serializeRows(actualRows);
    const expected = serializeRows(snapshotRows);

    assert(
      JSON.stringify(actual) === JSON.stringify(expected),
      `${label}: restored rows do not exactly match snapshot.\n
      Expected: ${JSON.stringify(expected, null, 2)}\n
      Actual: ${JSON.stringify(actual, null, 2)}`,
    );
  }

  async function fetchScopeRows(scope: Scope) {
    return prisma.distribution.findMany({
      where: {
        partnerId: BigInt(scope.partnerId),
        month: scope.month,
        year: String(scope.year),
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

  async function fetchMonthlyTotal(scope: Scope) {
    const monthlyRows = await prisma.monthlyData.findMany({
      where: {
        partnerId: BigInt(scope.partnerId),
        month: scope.month,
        year: String(scope.year),
      },
      select: {
        id: true,
        numDiapers: true,
        numBabies: true,
      },
    });

    assert(
      monthlyRows.length === 1,
      `Expected exactly one MonthlyData row for (${scope.partnerId},
      ${scope.month}, ${scope.year}),
      found ${monthlyRows.length}`,
    );

    return monthlyRows[0];
  }

  async function postDistributions(payload: Payload) {
    const { POST } = await import("../src/app/api/distributions/route");

    const request = new Request("http://local.test/api/distributions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
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

  async function restoreScope(scope: Scope, snapshotRows: SnapshotRow[]) {
    await prisma.$transaction(async (tx) => {
      await tx.distribution.deleteMany({
        where: {
          partnerId: BigInt(scope.partnerId),
          month: scope.month,
          year: String(scope.year),
        },
      });

      for (const row of snapshotRows) {
        await tx.distribution.create({
          data: {
            id: row.id,
            createdAt: row.createdAt,
            partnerId: row.partnerId,
            cityId: row.cityId,
            year: row.year,
            month: row.month ?? undefined,
            numberDiapers: row.numberDiapers,
            numberChildren: row.numberChildren,
            percentage: row.percentage,
          },
        });
      }
    });
  }

  async function runTestCase(testCase: (typeof TEST_CASES)[number]) {
    console.log(`\n=== ${testCase.name} ===`);

    const snapshotRows = await fetchScopeRows(testCase.scope);
    const monthly = await fetchMonthlyTotal(testCase.scope);

    try {
      verifyRowsByCityAndPercentage(
        snapshotRows,
        testCase.expectedStartingRows,
        `${testCase.name} starting-state check`,
      );

      const response = await postDistributions(testCase.payload);
      assert(
        response.status === 200,
        `${testCase.name}: POST /api/distributions failed with ${response.status}\n
        Response: ${JSON.stringify(response.json, null, 2)}`,
      );

      const responseJson = response.json as {
        success?: boolean;
        message?: string;
        rowsCreated?: number;
      } | null;

      assert(responseJson?.success === true, `${testCase.name}: success !== true`);
      assert(
        responseJson?.rowsCreated === testCase.payload.percentages.length,
        `${testCase.name}: rowsCreated mismatch. expected=${testCase.payload.percentages.length}
        actual=${responseJson?.rowsCreated}`,
      );

      const finalRows = await fetchScopeRows(testCase.scope);

      verifyRowsByCityAndPercentage(
        finalRows,
        testCase.payload.percentages,
        `${testCase.name} final-state percentages`,
      );

      assert(
        finalRows.length === testCase.payload.percentages.length,
        `${testCase.name}: stale rows still exist after POST`,
      );

      const totalDiapers = Number(monthly.numDiapers ?? BigInt(0));
      const expectedAllocations = allocateLargestRemainder(
        totalDiapers,
        testCase.payload.percentages.map((row) => row.percentage),
      );

      const expectedByCity = new Map(
        testCase.payload.percentages.map((row, index) => [
          normalizeCityName(row.city),
          expectedAllocations[index],
        ]),
      );

      const actualTotalDiapers = finalRows.reduce(
        (sum, row) => sum + Number(row.numberDiapers ?? BigInt(0)),
        0,
      );

      assert(
        actualTotalDiapers === totalDiapers,
        `${testCase.name}: total diapers changed. expected=${totalDiapers}
        actual=${actualTotalDiapers}`,
      );

      for (const row of finalRows) {
        const city = normalizeCityName(row.city?.name);
        const expected = expectedByCity.get(city);

        assert(expected !== undefined, `${testCase.name}: unexpected city in final rows: ${city}`);
        assert(
          Number(row.numberDiapers ?? BigInt(0)) === expected,
          `${testCase.name}: numberDiapers mismatch for ${city}.
          expected=${expected} actual=${String(row.numberDiapers ?? BigInt(0))}`,
        );
      }

      const monthlyAfter = await fetchMonthlyTotal(testCase.scope);
      assert(
        String(monthlyAfter.numDiapers ?? BigInt(0)) === String(monthly.numDiapers ?? BigInt(0)),
        `${testCase.name}: MonthlyData.numDiapers changed unexpectedly`,
      );

      console.log(`PASS ${testCase.name}`);
    } finally {
      await restoreScope(testCase.scope, snapshotRows);

      const restoredRows = await fetchScopeRows(testCase.scope);
      verifyExactRestore(restoredRows, snapshotRows, `${testCase.name} restore-check`);

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
