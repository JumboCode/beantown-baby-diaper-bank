#!/usr/bin/env node

import pg from "pg";
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const FLOAT_TOLERANCE = 1e-6;
const DATABASE_URL = process.env.DATABASE_URL;

const PARTNER_58 = {
  id: 58,
  name: "Test Partner 2",
  description: "Test-P3-NewCities-UpdatePartner",
  start_partner: "2026-03-01",
  status: "active",
  coordinates: { lat: 42.3601, lng: -71.0589 },
  address: "126 Main St, Boston, MA, 02108, United States",
  logo: "",
  cities: [
    { city: "Boston", percentage: 0.5, id: 1 },
    { city: "Cambridge", percentage: 0.5, id: 3 },
  ],
};

const PARTNER_53 = {
  id: 53,
  name: "Test Partner",
  description: "Test-P2-ExistingCities-UpdatePartner",
  start_partner: "2026-03-01",
  status: "active",
  coordinates: { lat: 42.3601, lng: -71.0589 },
  address: "123 Main St, Boston, MA, 02108, United States",
  logo: "",
  cities: [
    { city: "Boston", percentage: 0.6, id: 1 },
    { city: "Springfield", percentage: 0.4 },
  ],
};

const TEST_CASES = [
  {
    name: "Existing cities: partner 58 (Boston/Cambridge)",
    partner: PARTNER_58,
    logoAction: "keep",
    expectedStatus: 200,
    verifyRegions: true,
    expectedLogo: "any",
  },
  {
    name: "Mixed existing/new city: partner 53 (Boston/Springfield)",
    partner: PARTNER_53,
    logoAction: "keep",
    expectedStatus: 200,
    verifyRegions: true,
    expectedLogo: "any",
  },
  {
    name: "Replace logo with valid PNG (partner 58)",
    partner: PARTNER_58,
    logoAction: "replace",
    filePath: "public/funnypictures/cat1.png",
    fileType: "image/png",
    expectedStatus: 200,
    verifyRegions: true,
    expectedLogo: "non-empty",
  },
  {
    name: "Replace logo with invalid SVG (partner 58) -> reject",
    partner: PARTNER_58,
    logoAction: "replace",
    filePath: "public/diaper.svg",
    fileType: "image/svg+xml",
    expectedStatus: [400, 415],
    verifyPartner: false,
    verifyRegions: false,
  },
  {
    name: "Remove logo (partner 58)",
    partner: PARTNER_58,
    logoAction: "remove",
    expectedStatus: 200,
    verifyRegions: true,
    expectedLogo: "empty",
  },
];

function normalizeCityName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nearlyEqual(a, b, tolerance = FLOAT_TOLERANCE) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

function monthKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchPartnerRegionsFromDb(partnerId) {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set; cannot verify partner regions via database fallback.",
    );
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      `
        SELECT
          pr.partner_id AS "partnerId",
          pr.city_id AS "cityId",
          pr.percentage AS "percentage",
          c.name AS "cityName"
        FROM "partner_regions" pr
        JOIN "Cities" c ON c.id = pr.city_id
        WHERE pr.partner_id = $1
      `,
      [partnerId],
    );

    return rows;
  } finally {
    await client.end();
  }
}

async function postPartner(caseDef) {
  const body = new FormData();
  body.append("partner", JSON.stringify(caseDef.partner));
  body.append("logoAction", caseDef.logoAction);

  if (caseDef.filePath) {
    const absolutePath = path.resolve(caseDef.filePath);
    const fileContent = await readFile(absolutePath);
    const file = new File([fileContent], path.basename(absolutePath), {
      type: caseDef.fileType ?? "application/octet-stream",
    });
    body.append("file", file);
  }

  const response = await fetch(`${BASE_URL}/api/partners`, {
    method: "POST",
    body,
  });

  let json = null;
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

async function fetchPartnerById(partnerId) {
  const response = await fetch(`${BASE_URL}/api/partners`);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(
      `GET /api/partners failed (${response.status}): ${JSON.stringify(json)}`,
    );
  }

  const data = Array.isArray(json?.data) ? json.data : [];
  return data.find((partner) => Number(partner.id) === Number(partnerId)) ?? null;
}

async function fetchPartnerRegions(partnerId) {
  const response = await fetch(
    `${BASE_URL}/api/partners/percentages?partnerId=${partnerId}`,
  );

  if (response.status === 401 || response.status === 403) {
    process.stdout.write(
      `Info: /api/partners/percentages is protected (${response.status}); using DB fallback for partner ${partnerId}.\n`,
    );
    return fetchPartnerRegionsFromDb(partnerId);
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(
      `GET /api/partners/percentages failed (${response.status}): ${JSON.stringify(
        json,
      )}`,
    );
  }

  return Array.isArray(json?.data) ? json.data : [];
}

function verifyPartnerFields(caseDef, actualPartner) {
  const expected = caseDef.partner;

  assert(actualPartner, `Partner ${expected.id} not found in GET /api/partners`);
  assert(
    actualPartner.name === expected.name,
    `Partner ${expected.id}: name mismatch. expected="${expected.name}" actual="${actualPartner.name}"`,
  );
  assert(
    actualPartner.description === expected.description,
    `Partner ${expected.id}: description mismatch.`,
  );
  assert(
    actualPartner.status === expected.status,
    `Partner ${expected.id}: status mismatch.`,
  );
  assert(
    actualPartner.address === expected.address,
    `Partner ${expected.id}: address mismatch.`,
  );

  assert(
    monthKey(actualPartner.start_partner) === monthKey(expected.start_partner),
    `Partner ${expected.id}: start_partner month mismatch. expected=${monthKey(
      expected.start_partner,
    )} actual=${monthKey(actualPartner.start_partner)}`,
  );

  const actualCoords = actualPartner.coords ?? {};
  assert(
    nearlyEqual(actualCoords.lat, expected.coordinates.lat),
    `Partner ${expected.id}: latitude mismatch. expected=${expected.coordinates.lat} actual=${actualCoords.lat}`,
  );
  assert(
    nearlyEqual(actualCoords.lng, expected.coordinates.lng),
    `Partner ${expected.id}: longitude mismatch. expected=${expected.coordinates.lng} actual=${actualCoords.lng}`,
  );
}

function verifyPartnerRegions(caseDef, actualRegions) {
  const expectedByCity = new Map();
  for (const row of caseDef.partner.cities) {
    expectedByCity.set(normalizeCityName(row.city), Number(row.percentage));
  }

  const actualByCity = new Map();
  for (const row of actualRegions) {
    const cityName = row?.city?.name ?? row?.cityName;
    if (!cityName) continue;
    actualByCity.set(normalizeCityName(cityName), Number(row.percentage));
  }

  assert(
    actualByCity.size === expectedByCity.size,
    `Partner ${caseDef.partner.id}: region count mismatch. expected=${expectedByCity.size} actual=${actualByCity.size}`,
  );

  for (const [city, expectedPct] of expectedByCity.entries()) {
    assert(
      actualByCity.has(city),
      `Partner ${caseDef.partner.id}: missing city in partner_regions -> ${city}`,
    );
    const actualPct = actualByCity.get(city);
    assert(
      nearlyEqual(actualPct, expectedPct),
      `Partner ${caseDef.partner.id}: percentage mismatch for ${city}. expected=${expectedPct} actual=${actualPct}`,
    );
  }
}

function verifyLogoExpectation(caseDef, actualPartner) {
  if (caseDef.expectedLogo === "any" || caseDef.expectedLogo == null) {
    return;
  }

  if (caseDef.expectedLogo === "non-empty") {
    assert(
      typeof actualPartner.logo_url === "string" && actualPartner.logo_url.length > 0,
      `Partner ${caseDef.partner.id}: expected a non-empty logo_url after replace.`,
    );
    return;
  }

  if (caseDef.expectedLogo === "empty") {
    assert(
      !actualPartner.logo_url,
      `Partner ${caseDef.partner.id}: expected empty logo_url after remove, got "${actualPartner.logo_url}"`,
    );
  }
}

function assertExpectedStatus(caseDef, actualStatus, responseJson) {
  const expected = Array.isArray(caseDef.expectedStatus)
    ? caseDef.expectedStatus
    : [caseDef.expectedStatus ?? 200];

  assert(
    expected.includes(actualStatus),
    `Unexpected status for "${caseDef.name}". expected=${expected.join(
      "/",
    )} actual=${actualStatus} body=${JSON.stringify(responseJson)}`,
  );
}

async function runCase(caseDef) {
  process.stdout.write(`\n[RUN] ${caseDef.name}\n`);
  const postResult = await postPartner(caseDef);
  assertExpectedStatus(caseDef, postResult.status, postResult.json);

  const isSuccessStatus = postResult.status >= 200 && postResult.status < 300;
  if (!isSuccessStatus) {
    process.stdout.write(`[PASS] ${caseDef.name}\n`);
    return;
  }

  const partner = await fetchPartnerById(caseDef.partner.id);
  if (caseDef.verifyPartner !== false) {
    verifyPartnerFields(caseDef, partner);
  }
  verifyLogoExpectation(caseDef, partner);

  if (caseDef.verifyRegions !== false) {
    const regions = await fetchPartnerRegions(caseDef.partner.id);
    verifyPartnerRegions(caseDef, regions);
  }

  process.stdout.write(`[PASS] ${caseDef.name}\n`);
}

async function main() {
  process.stdout.write(`Base URL: ${BASE_URL}\n`);
  let failed = 0;

  for (const testCase of TEST_CASES) {
    try {
      await runCase(testCase);
    } catch (error) {
      failed += 1;
      process.stdout.write(
        `[FAIL] ${testCase.name}\n${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }

  if (failed > 0) {
    process.stdout.write(`\n${failed} test case(s) failed.\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write("\nAll test cases passed.\n");
}

await main();
