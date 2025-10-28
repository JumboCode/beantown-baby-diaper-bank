// prisma/seed.ts
import path from "node:path";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { prisma } from "../src/lib/prisma";

// generic CSV loader -> array of plain objects
async function loadCsv<T extends Record<string, string | undefined>>(
  file: string
) {
  const rows: T[] = [];
  const parser = createReadStream(file).pipe(
    parse({ columns: true, skip_empty_lines: true, bom: true, trim: true })
  );
  for await (const record of parser) rows.push(record as T);
  return rows;
}

const toBigInt = (value: string | undefined) =>
  value && value.length > 0 ? BigInt(value) : undefined;
const toNumber = (value: string | undefined) =>
  value && value.length > 0 ? Number(value) : undefined;
const toDate = (value: string | undefined) =>
  value && value.length > 0 ? new Date(value) : undefined;
const toStringOrNull = (value: string | undefined) =>
  value && value.length > 0 ? value : null;

async function seedCities() {
  type Row = {
    id: string;
    created_at?: string;
    name?: string;
  };

  const rows = await loadCsv<Row>(path.join(__dirname, "data/cities.csv"));
  await prisma.city.createMany({
    data: rows.map((row) => ({
      id: toBigInt(row.id),
      createdAt: toDate(row.created_at),
      name: toStringOrNull(row.name),
    })),
    skipDuplicates: true,
  });
}

async function seedPartners() {
  type Row = {
    id: string;
    created_at?: string;
    name?: string;
    description?: string;
    start_partner?: string;
    waitlisted?: string;
    address?: string;
    coords?: string;
    logo_url?: string;
  };

  const rows = await loadCsv<Row>(path.join(__dirname, "data/partners.csv"));
  await prisma.partner.createMany({
    data: rows.map((row) => ({
      id: toBigInt(row.id),
      createdAt: toDate(row.created_at),
      name: toStringOrNull(row.name),
      description: toStringOrNull(row.description),
      startPartner: toDate(row.start_partner),
      waitlisted: row.waitlisted ? row.waitlisted === "true" : undefined,
      address: toStringOrNull(row.address),
      coords: row.coords ? JSON.parse(row.coords) : undefined,
      logoUrl: toStringOrNull(row.logo_url),
    })),
    skipDuplicates: true,
  });
}

async function seedDistributions() {
  type Row = {
    id: string;
    created_at?: string;
    partner_id?: string;
    city_id?: string;
    year?: string;
    month?: string;
    number_diapers?: string;
    number_children?: string;
    percentage?: string;
  };

  const rows = await loadCsv<Row>(
    path.join(__dirname, "data/distributions.csv")
  );
  await prisma.distribution.createMany({
    data: rows.map((row) => ({
      id: toBigInt(row.id),
      createdAt: toDate(row.created_at),
      partnerId: toBigInt(row.partner_id),
      cityId: toBigInt(row.city_id),
      year: toStringOrNull(row.year),
      month: toStringOrNull(row.month),
      numberDiapers: toBigInt(row.number_diapers),
      numberChildren: toBigInt(row.number_children),
      percentage: toNumber(row.percentage),
    })),
    skipDuplicates: true,
  });
}

async function seedPartnerRegions() {
  type Row = {
    partner_id: string;
    city_id: string;
  };

  const rows = await loadCsv<Row>(
    path.join(__dirname, "data/partner_regions.csv")
  );
  let data: { partnerId: bigint; cityId: bigint }[] = [];
  try {
    data = rows.map((row) => {
      const partnerId = toBigInt(row.partner_id);
      const cityId = toBigInt(row.city_id);
      if (!partnerId || !cityId) {
        throw new Error(
          `Invalid partnerId or cityId in row: ${JSON.stringify(row)}`
        );
      }
      return { partnerId, cityId };
    });
  } catch (error) {
    console.error("Error parsing partner regions:", error);
  }

  await prisma.partnerRegion.createMany({
    data,
    skipDuplicates: true,
  });
}

async function main() {
  await seedCities();
  await seedPartners();
  await seedDistributions();
  await seedPartnerRegions();
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
