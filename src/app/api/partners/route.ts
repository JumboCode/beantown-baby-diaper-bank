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

type LogoAction = "keep" | "replace" | "remove";
type CityPercentage = {
  city: string;
  percentage: number;
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
// Create put for new partner
export async function PUT(request: Request) {
  let payload: CreatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  // 1. parse & validate request (payload, logoAction, logoFile)
  // 2. validate & insert new city into DB if needed
  // 3. move insertions for partner & partnerRegion into a single transaction
  // 4. upload logo file

  // 1. parse & validate request (payload, logoAction, logoFile), fail fast 
  // in the case of erroneous input

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

  // 2. validate city & insert into DB if city doesn't exist yet
  const cityNames = payload.cities.map((city: { city: string }) => city.city);
  let cityIdByName: Map<String, Number>;
  try {
    cityIdByName = await prisma.$transaction(async (tx) => {
      // find existing cities
      const existingCities = await tx.city.findMany({
        where: {
          name: {
            in: cityNames,
          },
        },
      });
      const existingCityNames = new Set(existingCities.map((city) => city.name));
      // create missing cities, if there are any
      const missingCityNames = cityNames.filter((name) => !existingCityNames.has(name));
      if (missingCityNames.length > 0) {
        await prisma.city.createMany({
          data: missingCityNames.map((name) => ({ name })),
          skipDuplicates: true,
        });
      }
      // fetch all cities
      const allCities = await tx.city.findMany({
        where: {
          name: {
            in: cityNames,
          },
        },
      });
      return new Map(allCities.map((city) => [city.name, city.id]));
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to prepare cities";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 3. upload partner logo
  

  // 4. create new partner & partner regions

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

  let partner: Partner;
  try {
    partner = await prisma.partner.create(newPartnerRequest);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to insert partner into database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const partnerId = Number(partner.id);
  // let cityIds: City[] = await prisma.city.findMany({
  //   where: {
  //     name: {
  //       in: cityNames,
  //     },
  //   },
  // });

  // const cityIdByName = new Map(
  //   cityIds
  //     .filter((city) => typeof city.name === "string")
  //     .map((city) => [city.name as string, city.id]),
  // );
  // const missingCities = cityNames.filter((name) => !cityIdByName.has(name));
  // if (missingCities.length > 0) {
  //   await prisma.city.createMany({
  //     data: missingCities.map((name) => ({ name })),
  //     skipDuplicates: true,
  //   });
  
  //   cityIds = await prisma.city.findMany({
  //     where: {
  //       name: {
  //         in: cityNames,
  //       },
  //     },
  //   });
  // }
  
  const refreshedCityIdByName = new Map(
    cityIds
      .filter((city) => typeof city.name === "string")
      .map((city) => [city.name as string, city.id]),
  );
  const unresolvedCities = cityNames.filter(
    (name) => !refreshedCityIdByName.has(name),
  );
  if (unresolvedCities.length > 0) {
    return NextResponse.json(
      { error: `Unable to resolve cities: ${unresolvedCities.join(", ")}` },
      { status: 400 },
    );
  }
  

  // 304 - 365
  const newPartnerRegionsRequest = {
    data: payload.cities.map((city: CityPercentage) => ({
      partnerId: partnerId,
      cityId: refreshedCityIdByName.get(city.city)!,
      percentage: city.percentage,
    })),
  } satisfies PrismaTypes.PartnerRegionCreateManyArgs;

  console.log("Received partner data:", payload);
  let uploadedObjectKey: string | undefined;
  try {
    // update partner region table
    const partnerRegion = await prisma.partnerRegion.createMany(
      newPartnerRegionsRequest,
    );
    console.log("created partner regions");
    console.log(logoAction);

    let partnerToReturn = partner;

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
      uploadedObjectKey = uploadResult.objectKey;

      partnerToReturn = await prisma.partner.update({
        where: { id: partnerId },
        data: { logoUrl: uploadResult.publicUrl },
      });
    }

    console.log("Created partner regions:", partnerRegion);

    return NextResponse.json({
      data: stringifyWithBigInt(partnerToReturn),
    });
  } catch (error) {
    try {
      await cleanupPartnerCreate(partnerId, uploadedObjectKey);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up create partner operation:",
        cleanupError,
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create partner.";
    const statusCode =
      error instanceof PartnerRequestError || error instanceof FileUploadError
        ? error.status
        : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
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
