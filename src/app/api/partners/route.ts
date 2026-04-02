import { NextResponse } from "next/server";
import { revalidateTag, cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes, status } from "@/generated/prisma/client";
import type { City, Partner } from "@/generated/prisma/client";
import { stringifyWithBigInt } from "@/lib/util";
import {
  deleteLogoObject,
  FileUploadError,
  getLogoObjectKey,
  uploadLogoForPartner,
  validateImageSignature,
  validateLogoFile,
} from "@/lib/server/logoUpload";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

type LogoAction = "keep" | "replace" | "remove";

type CityPercentage = {
  city: string;
  percentage: number;
  id?: string;
};

type CityGeoData = {
  centroidGeoJson: string;
  boundaryGeoJson: string;
  addressType: string;
};

type CreatePartnerPayload = {
  name: string;
  description: string;
  start_partner: string | null;
  end_partner?: string | null;
  status: status;
  coordinates: PrismaTypes.InputJsonValue;
  address: string;
  logo?: string;
  cities: CityPercentage[];
};

type UpdatePartnerPayload = {
  id: number;
  name: string;
  description: string;
  start_partner: string | null;
  end_partner?: string | null;
  status: status;
  coordinates: PrismaTypes.InputJsonValue;
  address: string;
  logo?: string;
  cities?: CityPercentage[];
};

function normalizeCityName(value: string): string {
  return value.trim().toLowerCase();
}

class PartnerRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function fetchCityGeoDataFromNominatim(cityName: string): Promise<CityGeoData> {
  const query = new URLSearchParams({
    q: `${cityName}, Massachusetts, United States`,
    format: "jsonv2",
    polygon_geojson: "1",
    limit: "1",
    countrycodes: "us",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${query.toString()}`, {
    headers: {
      "User-Agent": "beantown-baby-diaper-bank/1.0 (contact: your-email@domain.com)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new PartnerRequestError("Please check the entered cities.", 422);
  }

  const result = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    geojson?: unknown;
    addresstype?: string;
  }>;

  const first = result[0];
  if (!first) {
    throw new PartnerRequestError("Please check the entered cities.", 422);
  }

  const lat = first.lat ? Number(first.lat) : NaN;
  const lon = first.lon ? Number(first.lon) : NaN;
  const addressType = typeof first.addresstype === "string" ? first.addresstype : "";

  if (
    (addressType !== "town" && addressType !== "city") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !first.geojson
  ) {
    throw new PartnerRequestError("Please check the entered cities.", 422);
  }

  return {
    centroidGeoJson: JSON.stringify({
      type: "Point",
      coordinates: [lon, lat],
    }),
    addressType,
    boundaryGeoJson: JSON.stringify(first.geojson),
  };
}

async function getPartners(search: string | null, waitlisted: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  const where: PrismaTypes.PartnerWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (waitlisted === "true" || waitlisted === "false") {
    where.status = waitlisted === "true" ? "waitlisted" : { not: "waitlisted" };
  }

  const partners: Partner[] = await prisma.partner.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return partners.map((partner) => ({
    id: Number(partner.id),
    created_at: partner.createdAt.toISOString(),
    name: partner.name,
    description: partner.description,
    start_partner: partner.startPartner ? partner.startPartner.toISOString() : null,
    end_partner: partner.endPartner ? partner.endPartner.toISOString() : null,
    status: partner.status,
    waitlisted: partner.status === "waitlisted",
    address: partner.address,
    coords: partner.coords,
    logo_url: partner.logoUrl,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const waitlisted = searchParams.get("waitlisted");

  try {
    const data = await getPartners(search, waitlisted);
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load partners from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let payload: CreatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  try {
    const parsed = await parseCreatePartnerRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;

    if (logoAction === "replace") {
      if (!logoFile) {
        return NextResponse.json({ error: "File required" }, { status: 400 });
      }
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
    }
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const cityNames = Array.from(
    new Set(
      payload.cities
        .map((city) => city.city.trim())
        .filter((cityName): cityName is string => cityName.length > 0),
    ),
  );

  let cityIdByName: Map<string, bigint>;

  try {
    const cityWhere: PrismaTypes.CityWhereInput = {
      OR: cityNames.map((name) => ({
        name: {
          equals: name,
          mode: "insensitive",
        },
      })),
    };

    const existingCities: City[] = cityNames.length
      ? await prisma.city.findMany({ where: cityWhere })
      : [];
    const existingCityNames = new Set(
      existingCities
        .map((city) => city.name)
        .filter((name): name is string => Boolean(name))
        .map((name) => normalizeCityName(name)),
    );

    const missingCityNames = cityNames.filter(
      (name) => !existingCityNames.has(normalizeCityName(name)),
    );
    const cityGeoByName = new Map<string, CityGeoData>();

    for (const cityName of missingCityNames) {
      const geo = await fetchCityGeoDataFromNominatim(cityName);
      cityGeoByName.set(normalizeCityName(cityName), geo);
    }

    cityIdByName = await prisma.$transaction(async (tx) => {
      if (missingCityNames.length > 0) {
        await tx.city.createMany({
          data: missingCityNames.map((name) => ({ name })),
          skipDuplicates: true,
        });

        const insertedCities = await tx.city.findMany({
          where: {
            OR: missingCityNames.map((name) => ({
              name: {
                equals: name,
                mode: "insensitive",
              },
            })),
          },
          select: {
            id: true,
            name: true,
          },
        });

        for (const city of insertedCities) {
          if (!city.name) continue;
          const geoData = cityGeoByName.get(normalizeCityName(city.name));
          if (!geoData) continue;

          await tx.$executeRaw`
            UPDATE "Cities"
            SET
              "centroid" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.centroidGeoJson}), 4326),
              "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.boundaryGeoJson}), 4326)::geography
            WHERE id = ${city.id}
          `;
        }
      }

      const allCities = cityNames.length ? await tx.city.findMany({ where: cityWhere }) : [];

      return new Map(
        allCities
          .map((city) => [city.name ? normalizeCityName(city.name) : null, city.id])
          .filter(([name]) => name !== null) as Array<[string, bigint]>,
      );
    });
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to prepare cities";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let partner: Partner;
  try {
    partner = await prisma.$transaction(async (tx) => {
      const newPartner = await tx.partner.create({
        data: {
          name: payload.name,
          description: payload.description,
          startPartner: normalizeMonthDate(payload.start_partner),
          status: payload.status,
          coords: payload.coordinates,
          address: payload.address,
          logoUrl: logoAction === "replace" ? "" : (payload.logo ?? ""),
        },
      });

      const partnerId = Number(newPartner.id);
      const partnerRegionRows = payload.cities.map((city) => {
        const cityId = cityIdByName.get(normalizeCityName(city.city));
        if (!cityId) {
          throw new PartnerRequestError("Please check the entered cities.", 422);
        }

        return {
          partnerId,
          cityId,
          percentage: city.percentage,
        };
      });

      if (partnerRegionRows.length > 0) {
        await tx.partnerRegion.createMany({
          data: partnerRegionRows,
        });
      }

      return newPartner;
    });
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to create partner in database";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (logoAction === "replace") {
    let uploadedObjectKey: string | undefined;
    const partnerId = Number(partner.id);

    try {
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile!);
      uploadedObjectKey = uploadResult.objectKey;

      partner = await prisma.partner.update({
        where: { id: partner.id },
        data: { logoUrl: uploadResult.publicUrl },
      });
    } catch (error) {
      try {
        await cleanupPartnerCreate(partnerId, uploadedObjectKey);
      } catch (cleanupError) {
        console.error("Failed to clean up partner after logo upload failure:", cleanupError);
      }

      const message = error instanceof Error ? error.message : "Unable to create partner.";
      const statusCode =
        error instanceof PartnerRequestError || error instanceof FileUploadError
          ? error.status
          : 500;
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  }

  revalidateTag("cities", "max");
  return NextResponse.json({
    data: stringifyWithBigInt(partner),
  });
}

export async function POST(request: Request) {
  let payload: UpdatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  try {
    const parsed = await parseUpdatePartnerRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const partnerId = Number(payload.id);
  const submittedCities = Array.isArray(payload.cities) ? payload.cities : [];
  const shouldSyncPartnerRegions = submittedCities.length > 0;
  let cityIdByName = new Map<string, bigint>();

  if (shouldSyncPartnerRegions) {
    const cityNames = Array.from(
      new Set(
        submittedCities
          .map((city) => city.city.trim())
          .filter((cityName): cityName is string => cityName.length > 0),
      ),
    );

    if (cityNames.length === 0) {
      return NextResponse.json({ error: "Please check the entered cities." }, { status: 422 });
    }

    try {
      const cityWhere: PrismaTypes.CityWhereInput = {
        OR: cityNames.map((name) => ({
          name: {
            equals: name,
            mode: "insensitive",
          },
        })),
      };

      const existingCities: City[] = await prisma.city.findMany({
        where: cityWhere,
      });
      const existingCityNames = new Set(
        existingCities
          .map((city) => city.name)
          .filter((name): name is string => Boolean(name))
          .map((name) => normalizeCityName(name)),
      );

      const missingCityNames = cityNames.filter(
        (name) => !existingCityNames.has(normalizeCityName(name)),
      );
      const cityGeoByName = new Map<string, CityGeoData>();

      for (const cityName of missingCityNames) {
        const geo = await fetchCityGeoDataFromNominatim(cityName);
        cityGeoByName.set(normalizeCityName(cityName), geo);
      }

      cityIdByName = await prisma.$transaction(async (tx) => {
        if (missingCityNames.length > 0) {
          await tx.city.createMany({
            data: missingCityNames.map((name) => ({ name })),
            skipDuplicates: true,
          });

          const insertedCities = await tx.city.findMany({
            where: {
              OR: missingCityNames.map((name) => ({
                name: {
                  equals: name,
                  mode: "insensitive",
                },
              })),
            },
            select: {
              id: true,
              name: true,
            },
          });

          for (const city of insertedCities) {
            if (!city.name) continue;
            const geoData = cityGeoByName.get(normalizeCityName(city.name));
            if (!geoData) continue;

            await tx.$executeRaw`
              UPDATE "Cities"
              SET
                "centroid" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.centroidGeoJson}), 4326),
                "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.boundaryGeoJson}), 4326)::geography
              WHERE id = ${city.id}
            `;
          }
        }

        const allCities = await tx.city.findMany({
          where: cityWhere,
        });

        return new Map(
          allCities
            .map((city) => [city.name ? normalizeCityName(city.name) : null, city.id])
            .filter(([name]) => name !== null) as Array<[string, bigint]>,
        );
      });
    } catch (error) {
      if (error instanceof PartnerRequestError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      const message = error instanceof Error ? error.message : "Failed to prepare cities";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    let uploadedPublicUrl: string | undefined;

    if (logoAction === "replace") {
      if (!logoFile) {
        throw new PartnerRequestError("File is required when logoAction is replace", 400);
      }
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile);
      uploadedPublicUrl = uploadResult.publicUrl;
    }

    const partner = await prisma.$transaction(async (tx) => {
      const updatedPartner = await tx.partner.update({
        where: { id: partnerId },
        data: {
          name: payload.name,
          description: payload.description,
          startPartner: normalizeMonthDate(payload.start_partner),
          endPartner: normalizeMonthDate(payload.end_partner ?? null),
          status: payload.status,
          coords: payload.coordinates,
          address: payload.address,
          logoUrl:
            logoAction === "replace"
              ? uploadedPublicUrl!
              : logoAction === "remove"
                ? ""
                : (payload.logo ?? ""),
        },
      });

      if (shouldSyncPartnerRegions) {
        const percentageByCity = new Map<string, number>();

        for (const city of submittedCities) {
          if (!city || typeof city.city !== "string") {
            throw new PartnerRequestError("Please check the entered cities.", 422);
          }

          const normalizedCityName = normalizeCityName(city.city);
          if (!normalizedCityName) {
            throw new PartnerRequestError("Please check the entered cities.", 422);
          }

          percentageByCity.set(normalizedCityName, city.percentage);
        }

        const desiredRows = Array.from(percentageByCity.entries()).map(
          ([normalizedCityName, percentage]) => {
            const cityId = cityIdByName.get(normalizedCityName);
            if (!cityId) {
              throw new PartnerRequestError("Please check the entered cities.", 422);
            }

            return {
              partnerId: BigInt(partnerId),
              cityId,
              percentage,
            };
          },
        );

        const desiredCityIds = desiredRows.map((row) => row.cityId);

        await tx.partnerRegion.deleteMany({
          where: {
            partnerId: BigInt(partnerId),
            cityId: {
              notIn: desiredCityIds,
            },
          },
        });

        for (const row of desiredRows) {
          await tx.partnerRegion.upsert({
            where: {
              partnerId_cityId: {
                partnerId: row.partnerId,
                cityId: row.cityId,
              },
            },
            update: {
              percentage: row.percentage,
            },
            create: row,
          });
        }
      }

      return updatedPartner;
    });

    if (logoAction === "remove") {
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
    }

    revalidateTag("cities", "max");
    return NextResponse.json({
      data: stringifyWithBigInt(partner),
    });
  } catch (error) {
    if (logoAction === "replace") {
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Unable to update partner in database.";
    const statusCode =
      error instanceof PartnerRequestError || error instanceof FileUploadError ? error.status : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

function normalizeMonthDate(value: string | null): string | null {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) {
    throw new PartnerRequestError("Invalid date format", 400);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new PartnerRequestError("Invalid date value", 400);
  }

  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
}

function parseLogoAction(raw: FormDataEntryValue | null): LogoAction {
  if (raw === null) return "keep";
  if (typeof raw !== "string") {
    throw new PartnerRequestError("Invalid logoAction field", 400);
  }
  if (raw !== "keep" && raw !== "replace" && raw !== "remove") {
    throw new PartnerRequestError("logoAction must be keep, replace, or remove", 400);
  }
  return raw;
}

function assertCreatePayload(payload: unknown): asserts payload is CreatePartnerPayload {
  if (!payload || typeof payload !== "object") {
    throw new PartnerRequestError("Invalid partner payload", 400);
  }

  const candidate = payload as Partial<CreatePartnerPayload>;
  if (
    !candidate.name ||
    !candidate.description ||
    !candidate.status ||
    !candidate.address ||
    !Array.isArray(candidate.cities)
  ) {
    throw new PartnerRequestError("Missing required partner fields", 400);
  }
}

async function parseCreatePartnerRequest(request: Request): Promise<{
  payload: CreatePartnerPayload;
  logoAction: LogoAction;
  logoFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const partnerRaw = formData.get("partner");
    if (typeof partnerRaw !== "string") {
      throw new PartnerRequestError("partner form field is required", 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(partnerRaw);
    } catch {
      throw new PartnerRequestError("partner must be valid JSON", 400);
    }

    assertCreatePayload(parsed);

    const logoAction = parseLogoAction(formData.get("logoAction"));
    if (logoAction === "remove") {
      throw new PartnerRequestError("logoAction remove is invalid for create", 400);
    }

    const fileRaw = formData.get("file");
    const logoFile = fileRaw instanceof File ? fileRaw : null;
    if (logoAction === "replace" && !logoFile) {
      throw new PartnerRequestError("File is required when logoAction is replace", 400);
    }

    return { payload: parsed, logoAction, logoFile };
  }

  const body = (await request.json()) as unknown;
  assertCreatePayload(body);
  return { payload: body, logoAction: "keep", logoFile: null };
}

function assertUpdatePayload(payload: unknown): asserts payload is UpdatePartnerPayload {
  if (!payload || typeof payload !== "object") {
    throw new PartnerRequestError("Invalid partner payload", 400);
  }

  const candidate = payload as Partial<UpdatePartnerPayload>;
  if (
    typeof candidate.id !== "number" ||
    !candidate.name ||
    !candidate.description ||
    !candidate.status ||
    !candidate.address
  ) {
    throw new PartnerRequestError("Missing required partner fields", 400);
  }
}

async function parseUpdatePartnerRequest(request: Request): Promise<{
  payload: UpdatePartnerPayload;
  logoAction: LogoAction;
  logoFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const partnerRaw = formData.get("partner");
    if (typeof partnerRaw !== "string") {
      throw new PartnerRequestError("partner form field is required", 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(partnerRaw);
    } catch {
      throw new PartnerRequestError("partner must be valid JSON", 400);
    }

    assertUpdatePayload(parsed);

    const logoAction = parseLogoAction(formData.get("logoAction"));
    const fileRaw = formData.get("file");
    const logoFile = fileRaw instanceof File ? fileRaw : null;
    if (logoAction === "replace" && !logoFile) {
      throw new PartnerRequestError("File is required when logoAction is replace", 400);
    }

    return { payload: parsed, logoAction, logoFile };
  }

  const body = (await request.json()) as unknown;
  assertUpdatePayload(body);
  return { payload: body, logoAction: "keep", logoFile: null };
}

async function cleanupPartnerCreate(partnerId: number, objectKey?: string): Promise<void> {
  if (objectKey) {
    await deleteLogoObject(objectKey).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "unknown storage cleanup error";
      console.error("Failed to delete uploaded logo during rollback:", message);
    });
  }

  await prisma.$transaction([
    prisma.partnerRegion.deleteMany({ where: { partnerId } }),
    prisma.partner.delete({ where: { id: partnerId } }),
  ]);
}
