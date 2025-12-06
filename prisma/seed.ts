// prisma/seed.ts
import path from "node:path";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { prisma } from "../src/lib/prisma";
import { YearlyDataCreateManyInput } from "@/generated/prisma/models";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";

// generic CSV loader -> array of plain objects
async function loadCsv<T extends Record<string, string | undefined>>(
  file: string,
) {
  console.log(`Loading CSV data from ${file}...`);
  const rows: T[] = [];
  const parser = createReadStream(file).pipe(
    parse({ columns: true, skip_empty_lines: true, bom: true, trim: true }),
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

async function loadBoundaryGeometry(cityName?: string) {
  if (!cityName) return null;
  const slug = cityName.toLowerCase().replace(/\s+/g, "-");
  const file = path.join(__dirname, "data/geojson", `${slug}.geojson`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);
    const feature =
      json.type === "FeatureCollection" ? json.features?.[0] : json;
    if (!feature?.geometry) return null;
    return JSON.stringify(feature.geometry);
  } catch (err) {
    console.warn(`No boundary file for ${cityName}:`, err);
    return null;
  }
}

async function seedCities() {
  type Row = {
    id: string;
    created_at?: string;
    name?: string;
    centroid?: string;
  };

  const rows = await loadCsv<Row>(path.join(__dirname, "data/cities.csv"));
  await prisma.city.createMany({
    data: rows.map((row) => ({
      id: toBigInt(row.id),
      createdAt: toDate(row.created_at),
      name: toStringOrNull(row.name),
      // centroid: row.centroid ? JSON.parse(row.centroid) : undefined,
    })),
    skipDuplicates: true,
  });
  for (const row of rows) {
    if (!row.centroid) continue;
    await prisma.$executeRaw`
    UPDATE "Cities"
    SET "centroid" = ST_GeomFromGeoJSON(${row.centroid})
    WHERE id = ${toBigInt(row.id)}
  `;
  }
  for (const row of rows) {
    const boundary = await loadBoundaryGeometry(row.name);
    if (!boundary) continue;
    await prisma.$executeRaw`
  UPDATE "Cities"
  SET "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${boundary}), 4326)::geography
  WHERE id = ${toBigInt(row.id)}
`;
  }
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
      waitlisted: row.waitlisted ? row.waitlisted === "TRUE" : undefined,
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
    path.join(__dirname, "data/distributions.csv"),
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
    path.join(__dirname, "data/partner_regions.csv"),
  );
  let data: { partnerId: bigint; cityId: bigint }[] = [];
  try {
    data = rows.map((row) => {
      const partnerId = toBigInt(row.partner_id);
      const cityId = toBigInt(row.city_id);
      if (!partnerId || !cityId) {
        throw new Error(
          `Invalid partnerId or cityId in row: ${JSON.stringify(row)}`,
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

async function seedYearlyData() {
  // SSeed yearly data
  type Row = {
    city_id: string;
    year: string;
    num_diapers: string;
    num_babies: string;
  };

  const rows = await loadCsv<Row>(path.join(__dirname, "data/yearly_data.csv"));
  let data: YearlyDataCreateManyInput[] = [];
  try {
    data = rows.map((row) => {
      const cityId = toBigInt(row.city_id);
      const year = toStringOrNull(row.year);
      const numDiapers = toBigInt(row.num_diapers);
      const numBabies = toBigInt(row.num_babies);
      if (!cityId || !year || !numDiapers || !numBabies) {
        throw new Error(
          `Invalid cityId, year, numDiapers, or numBabies in row: ${JSON.stringify(row)}`,
        );
      }
      return {
        id: randomUUID(),
        cityId,
        year,
        numDiapers,
        numBabies,
      };
    });
  } catch (error) {
    console.error("Error parsing yearly data:", error);
  }
  await prisma.yearlyData.createMany({
    data,
    skipDuplicates: true,
  });
}

async function main() {
  // await prisma.$transaction([
  //   prisma.partnerRegion.deleteMany(),
  //   prisma.distribution.deleteMany(),
  //   prisma.partner.deleteMany(),
  //   prisma.city.deleteMany(),
  // ]);
  await seedCities();
  // await seedPartners();
  // await seedDistributions();
  // await seedPartnerRegions();
  // await seedYearlyData();
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
