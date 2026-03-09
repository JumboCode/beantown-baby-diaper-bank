import "dotenv/config";
import path from "node:path";
import { promises as fs } from "node:fs";
import { prisma } from "../src/lib/prisma";

const GEOJSON_DIR = path.join(process.cwd(), "prisma/data/geojson");

const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: unknown;
};

const isGeometry = (value: unknown): value is GeoJsonGeometry => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as GeoJsonGeometry;
  return (
    typeof maybe.type === "string" &&
    (Object.prototype.hasOwnProperty.call(maybe, "coordinates") ||
      Object.prototype.hasOwnProperty.call(maybe, "geometries"))
  );
};

const extractGeometry = (input: unknown): GeoJsonGeometry | null => {
  if (!input) return null;

  if (Array.isArray(input)) {
    for (const item of input) {
      const geometry = extractGeometry(item);
      if (geometry) return geometry;
    }
    return null;
  }

  if (typeof input !== "object") return null;
  const value = input as Record<string, unknown>;

  if (isGeometry(value)) return value;

  if (value.type === "Feature" && value.geometry) {
    return extractGeometry(value.geometry);
  }

  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    return extractGeometry(value.features);
  }

  if (value.geojson) {
    return extractGeometry(value.geojson);
  }

  if (value.geometry) {
    return extractGeometry(value.geometry);
  }

  return null;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Ensure your .env is present or export DATABASE_URL before running this script.",
    );
  }

  const entries = await fs.readdir(GEOJSON_DIR, { withFileTypes: true });
  const geoJsonFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".geojson"),
  );

  const fileByNormalizedName = new Map<string, string>();
  for (const file of geoJsonFiles) {
    const baseName = path.basename(file.name, ".geojson");
    const key = normalizeName(baseName);

    if (fileByNormalizedName.has(key)) {
      console.warn(
        `Skipping duplicate normalized key "${key}" for file "${file.name}".`,
      );
      continue;
    }

    fileByNormalizedName.set(key, path.join(GEOJSON_DIR, file.name));
  }

  const cities = await prisma.city.findMany({
    select: { id: true, name: true },
  });

  let updatedCount = 0;
  let missingBoundaryFileCount = 0;
  let missingGeometryCount = 0;

  for (const city of cities) {
    if (!city.name) continue;

    const key = normalizeName(city.name);
    const filePath = fileByNormalizedName.get(key);

    if (!filePath) {
      missingBoundaryFileCount++;
      continue;
    }

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const geometry = extractGeometry(parsed);

    if (!geometry) {
      missingGeometryCount++;
      console.warn(
        `No geometry found in ${path.basename(filePath)} for city "${city.name}".`,
      );
      continue;
    }

    await prisma.$executeRaw`
      UPDATE "Cities"
      SET "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)::geography
      WHERE "id" = ${city.id}
    `;
    updatedCount++;
  }

  console.log(`City boundary reseed complete.`);
  console.log(`Updated boundaries: ${updatedCount}`);
  console.log(`Cities without matching .geojson file: ${missingBoundaryFileCount}`);
  console.log(`Cities with unreadable geometry data: ${missingGeometryCount}`);
}

main()
  .catch((error) => {
    console.error("City boundary reseed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
