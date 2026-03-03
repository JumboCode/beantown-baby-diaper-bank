import { NextResponse } from "next/server";
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
};
type CityGeoData = {
  centroidGeoJson: string;
  boundaryGeoJson: string;
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
};

class PartnerRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Fetch city centroid and boundary data from OpenStreetMap Nominatim.
// This is used only for city names that are missing from the Cities table.
async function fetchCityGeoDataFromNominatim(
  cityName: string,
): Promise<CityGeoData> {
  // Scope lookup to MA, US for this project.
  const query = new URLSearchParams({
    q: `${cityName}, Massachusetts, United States`,
    format: "jsonv2",
    polygon_geojson: "1",
    limit: "1",
    countrycodes: "us",
  });

  // Nominatim requires a descriptive User-Agent with contact info.
  const response = await fetch(`${NOMINATIM_BASE_URL}?${query.toString()}`, {
    headers: {
      "User-Agent":
        "beantown-baby-diaper-bank/1.0 (contact: your-email@domain.com)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new PartnerRequestError(
      `Unable to retrieve geo data for ${cityName}`,
      502,
    );
  }

  // Parse search results and use the top match.
  const result = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    geojson?: unknown;
  }>;

  const first = result[0];
  if (!first) {
    throw new PartnerRequestError("Please check the entered cities.", 422);
  }

  const lat = first?.lat ? Number(first.lat) : NaN;
  const lon = first?.lon ? Number(first.lon) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !first.geojson) {
    throw new PartnerRequestError(
      "Please check the entered cities.",
      422,
    );
  }

  // Return GeoJSON strings so PostGIS can ingest them via ST_GeomFromGeoJSON.
  return {
    centroidGeoJson: JSON.stringify({
      type: "Point",
      coordinates: [lon, lat],
    }),
    boundaryGeoJson: JSON.stringify(first.geojson),
  };
}

/**
 * GET /api/partners
 *
 * Lists diaper bank partners from the Partners table. Supports optional
 * filtering by name search and waitlist status.
 *
 * Query params:
 *   - search: partial or case-insensitive match against the partner name.
 *   - waitlisted: "true" or "false" to filter by waitlist status.
 *
 * Example request:
 *  /api/partners?search=arlington&waitlisted=false
 *
 * Example response:
 * ```json{
 *   "data": [
 *    {
 *       "id": 1,
 *       "created_at": "2023-10-01T12:34:56.789Z",
 *       "name": "Arlington Eats",
 *       "description": "A description of Arlington Eats.",
 *       "start_partner": "2023-11-01T00:00:00.000Z",
 *       "waitlisted": false,
 *       "address": "123 Diaper St, Boston, MA",
 *       "coords": { "type": "Point", "coordinates": [-71.0589, 42.3601] },
 *       "logo_url": "https://example.com/logo.png"
 *    }
 *  ]
 * }```
 */
export async function GET(request: Request) {
  // Extract query parameters(checkout dev-example for reference)
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search");
  const waitlisted = searchParams.get("waitlisted");

  // Build the Prisma query filters based on provided params
  // WhereInput type helps ensure we build valid queries
  const where: PrismaTypes.PartnerWhereInput = {};

  if (search) {
    // Case-insensitive partial match on name
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Filter by waitlist status if provided (use status, not legacy waitlisted flag)
  if (waitlisted === "true" || waitlisted === "false") {
    if (waitlisted === "true") {
      where.status = "waitlisted";
    } else {
      where.status = { not: "waitlisted" };
    }
  }

  try {
    // Query the database for partners matching the filters
    // prisma handles reaching out to the DB and executing the query
    const partners: Partner[] = await prisma.partner.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Format the partners for the response
    // everything needs to be serializable to JSON
    // Date objects are converted to ISO strings
    // BigInt fields (like IDs) are converted to numbers or strings
    const dataToReturn = partners.map((partner) => ({
      id: Number(partner.id),
      created_at: partner.createdAt.toISOString(),
      name: partner.name,
      description: partner.description,
      start_partner: partner.startPartner
        ? partner.startPartner.toISOString()
        : null,
      end_partner: partner.endPartner ? partner.endPartner.toISOString() : null,
      status: partner.status,
      waitlisted: partner.status === "waitlisted",
      address: partner.address,
      coords: partner.coords,
      logo_url: partner.logoUrl,
    }));

    //return the partners as a JSON response
    return NextResponse.json({
      data: dataToReturn,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load partners from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create put for new partner: create a new partner 
// (plus city-region links, plus optional logo upload).
export async function PUT(request: Request) {
  let payload: CreatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  // 1. parse & validate request (payload, logoAction, logoFile), fail fast 
  // if input is erroneous
  try {
    const parsed = await parseCreatePartnerRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;

    if (logoAction === 'replace') {
      if (!logoFile) {
        return NextResponse.json({ error: 'File required' }, { status: 400 });
      }
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
    }
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      console.log('inside error instanceof PartnerRequestError');
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  // 2. Ensure submitted cities exist and enrich new ones with geo fields.

  const cityNames = Array.from(
    new Set(
      payload.cities
        .map((city: { city: string }) => city.city.trim())
        .filter((cityName): cityName is string => cityName.length > 0),
    ),
  );
  let cityIdByName: Map<string, bigint>;
  try {
    console.log('inside city validation');
    const existingCities: City[] = await prisma.city.findMany({
      where: {
        name: {
          in: cityNames,
        },
      },
    });
    const existingCityNames = new Set(existingCities.map((city) => city.name));

    // Find city names not already in DB.
    const missingCityNames = cityNames.filter((name) => !existingCityNames.has(name));
    const cityGeoByName = new Map<string, CityGeoData>();

    // Fetch geo data before DB transaction (avoid HTTP calls inside transaction).
    for (const cityName of missingCityNames) {
      const geo = await fetchCityGeoDataFromNominatim(cityName);
      cityGeoByName.set(cityName, geo);
    }

    cityIdByName = await prisma.$transaction(async (tx) => {
      if (missingCityNames.length > 0) {
        await tx.city.createMany({
          data: missingCityNames.map((name) => ({ name })),
          skipDuplicates: true,
        });

        // createMany does not return IDs, so re-query inserted rows.
        const insertedCities = await tx.city.findMany({
          where: {
            name: {
              in: missingCityNames,
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        for (const city of insertedCities) {
          const name = city.name;
          if (!name) continue;
          const geoData = cityGeoByName.get(name);
          if (!geoData) continue;

          // centroid/boundary are PostGIS columns, so write them through SQL.
          await tx.$executeRaw`
            UPDATE "Cities"
            SET
              "centroid" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.centroidGeoJson}), 4326),
              "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${geoData.boundaryGeoJson}), 4326)::geography
            WHERE id = ${city.id}
          `;
        }
      }

      // fetch all cities
      const allCities = await tx.city.findMany({
        where: {
          name: {
            in: cityNames,
          },
        },
      });
      return new Map (allCities
        .map((city) => [city.name, city.id])
        .filter(([name]) => name !== null) as Array<[string, bigint]>
      );
    });
    console.log(cityIdByName);
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to prepare cities";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  
  // 3. create new partner & partner regions, rollback the entire partner adding
  // if any step in the middle fails.
  let partner: Partner;
  try {
    console.log('inside P3 - partners');
    partner = await prisma.$transaction(async (tx) => {
      // 3a. create new partner
      const newPartnerRequest = {
        data: {
          name: payload.name,
          description: payload.description,
          startPartner: normalizeStartPartner(payload.start_partner),
          status: payload.status as status,
          coords: payload.coordinates,
          address: payload.address,
          logoUrl: logoAction === "replace" ? "" : (payload.logo ?? ""),
        },
      } as PrismaTypes.PartnerCreateArgs;
      const newPartner = await tx.partner.create(newPartnerRequest);

      const partnerId = Number(newPartner.id);
      console.log('created new partner, id:', partnerId);

      // 3b. create new partner regions
      const partnerRegionRows = payload.cities.map((city: CityPercentage) => {
        const normalizedCityName = city.city.trim();
        const cityId = cityIdByName.get(normalizedCityName);
        if (!cityId) {
          throw new PartnerRequestError("Please check the entered cities.", 422);
        }
        return {
          partnerId: partnerId,
          cityId,
          percentage: city.percentage,
        };
      });

      await tx.partnerRegion.createMany({
        data: partnerRegionRows,
      });

      console.log("Created partner regions for partner ID:", partnerId);
      return newPartner;
    })
  } catch (error) {
    const message = error instanceof Error ? 
      error.message : "Unable to create partner in database";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // upload logo to file storage, rollback the entire partner adding if 
  //    a) logo upload failed
  //    b) publicUrl does not get synced into the Partners table
  
  if (logoAction === 'replace') {
    console.log('inside logoAction === replace');
    
    let uploadedObjectKey: string | undefined;
    let partnerId = Number(partner.id);
    
    try {
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile!);
      console.log('Logo uploaded:', uploadResult.objectKey);
      uploadedObjectKey = uploadResult?.objectKey;
      
      partner = await prisma.partner.update({
        where: { id: partner.id },
        data: { logoUrl: uploadResult.publicUrl },
      });
      
      console.log('Updated logo file for partner');
    } catch (error) {
      // if logo upload failed for some reason, clean up the entire partner
      try {
        await cleanupPartnerCreate(partnerId, uploadedObjectKey);
      } catch (cleanupError) {
          console.error(
          "Failed to clean up partner after logo upload failure:",
          cleanupError
        );
      }
      const message = error instanceof Error ? 
        error.message : "Unable to create partner.";
      const statusCode = error instanceof PartnerRequestError || error instanceof FileUploadError
        ? error.status : 500;
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  }

  
  console.log('Partner created successfully:', partner.id);
  return NextResponse.json({
    data: stringifyWithBigInt(partner)
  })
}

// update an existing partner (plus optional logo replace/remove).
export async function POST(request: Request) {
  let payload: UpdatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  // Validate partner request
  try {
    const parsed = await parseUpdatePartnerRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  console.log("Received partner data:", payload);

  // Attempt to replace logo
  try {
    const partnerId = Number(payload.id);
    let uploadedPublicUrl: string | undefined;

    if (logoAction === "replace") {
      if (!logoFile) {
        throw new PartnerRequestError(
          "File is required when logoAction is replace",
          400,
        );
      }
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile);
      uploadedPublicUrl = uploadResult.publicUrl;
    }

    // Update partner fields
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        name: payload.name,
        description: payload.description,
        startPartner: normalizeStartPartner(payload.start_partner),
        endPartner: normalizeMonthDate(payload.end_partner ?? null),
        status: payload.status as status,
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

    // Remove or replace logo in database
    if (logoAction === "remove") {
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(
        () => undefined,
      );
    }

    return NextResponse.json({
      data: stringifyWithBigInt(partner),
    });
  } catch (error) {
    if (logoAction === "replace") {
      await deleteLogoObject(getLogoObjectKey(Number(payload.id))).catch(
        () => undefined,
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to insert partner into database.";
    const statusCode =
      error instanceof PartnerRequestError || error instanceof FileUploadError
        ? error.status
        : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

function normalizeStartPartner(value: string | null): string | null {
  return normalizeMonthDate(value);
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

// Limits what logoAction input can be (if invalid, keep is default)
function parseLogoAction(raw: FormDataEntryValue | null): LogoAction {
  if (raw === null) return "keep";
  if (typeof raw !== "string") {
    throw new PartnerRequestError("Invalid logoAction field", 400);
  }
  if (raw !== "keep" && raw !== "replace" && raw !== "remove") {
    throw new PartnerRequestError(
      "logoAction must be keep, replace, or remove",
      400,
    );
  }
  return raw;
}

// Enforce required partner fields
function assertCreatePayload(
  payload: unknown,
): asserts payload is CreatePartnerPayload {
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
      throw new PartnerRequestError(
        "logoAction remove is invalid for create",
        400,
      );
    }
    const fileRaw = formData.get("file");
    const logoFile = fileRaw instanceof File ? fileRaw : null;
    if (logoAction === "replace" && !logoFile) {
      throw new PartnerRequestError(
        "File is required when logoAction is replace",
        400,
      );
    }

    return { payload: parsed, logoAction, logoFile };
  }

  const body = (await request.json()) as unknown;
  assertCreatePayload(body);
  return { payload: body, logoAction: "keep", logoFile: null };
}

function assertUpdatePayload(
  payload: unknown,
): asserts payload is UpdatePartnerPayload {
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
      throw new PartnerRequestError(
        "File is required when logoAction is replace",
        400,
      );
    }
    return { payload: parsed, logoAction, logoFile };
  }

  const body = (await request.json()) as unknown;
  assertUpdatePayload(body);
  return { payload: body, logoAction: "keep", logoFile: null };
}

async function cleanupPartnerCreate(
  partnerId: number,
  objectKey?: string,
): Promise<void> {
  if (objectKey) {
    await deleteLogoObject(objectKey).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "unknown storage cleanup error";
      console.error("Failed to delete uploaded logo during rollback:", message);
    });
  }

  await prisma.$transaction([
    prisma.partnerRegion.deleteMany({ where: { partnerId } }),
    prisma.partner.delete({ where: { id: partnerId } }),
  ]);
}
