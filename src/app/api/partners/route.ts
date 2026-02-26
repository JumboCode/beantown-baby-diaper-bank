import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";
<<<<<<< HEAD
=======
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
>>>>>>> 64f60fec961c236a5a7b032abae5565eb4d78132

// Helper to ensure dates are saved as the 1st of the month per sprint requirements
const normalizeDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

export async function GET() {
  try {
<<<<<<< HEAD
    const partners = await prisma.partner.findMany();
    // Use JSON.parse to fix the "partners.map is not a function" error
    return NextResponse.json({ data: JSON.parse(stringifyWithBigInt(partners)) });
=======
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
>>>>>>> 64f60fec961c236a5a7b032abae5565eb4d78132
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

// Add New Partner logic
export async function PUT(request: Request) {
<<<<<<< HEAD
  const body = await request.json();
  const isWaitlisted = body.status === "waitlisted";

  const partnerData: any = {
    name: body.name,
    description: body.description,
    status: body.status,
    coords: body.coordinates,
    address: body.address,
    logoUrl: body.logo,
  };

  if (!isWaitlisted && body.start_partner) {
    partnerData.startPartner = normalizeDate(body.start_partner);
  }

  try {
    const partner = await prisma.partner.create({ data: partnerData });
    const partnerId = Number(partner.id);
=======
  let payload: CreatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  try {
    const parsed = await parseCreatePartnerRequest(request);
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

  const cities = payload.cities;
  const cityNames = cities.map((city: { city: string }) => city.city);

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
  const cityIds: City[] = await prisma.city.findMany({
    where: {
      name: {
        in: cityNames,
      },
    },
  });

  const cityIdByName = new Map(cityIds.map((city) => [city.name, city.id]));
  const missingCities = cityNames.filter((name) => !cityIdByName.has(name));
  if (missingCities.length > 0) {
    return NextResponse.json(
      { error: `Unknown cities: ${missingCities.join(", ")}` },
      { status: 400 },
    );
  }

  const newPartnerRegionsRequest = {
    data: payload.cities.map((city: CityPercentage) => ({
      partnerId: partnerId,
      cityId: cityIdByName.get(city.city)!,
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
>>>>>>> 64f60fec961c236a5a7b032abae5565eb4d78132

    if (!isWaitlisted && body.cities && body.cities.length > 0) {
      const cityNames = body.cities.map((city: any) => city.city);
      const cityIds = await prisma.city.findMany({
        where: { name: { in: cityNames } },
      });

<<<<<<< HEAD
      await prisma.partnerRegion.createMany({
        data: body.cities.map((city: any) => ({
          partnerId: partnerId,
          cityId: cityIds.find((c) => c.name === city.city)?.id,
          percentage: city.percentage,
        })),
      });
    }

    return NextResponse.json({ data: JSON.parse(stringifyWithBigInt(partner)) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
=======
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
>>>>>>> 64f60fec961c236a5a7b032abae5565eb4d78132
  }
}

// Update Partner logic (General)
export async function POST(request: Request) {
<<<<<<< HEAD
  const body = await request.json();
  
  const updateData: any = {
    name: body.name,
    description: body.description,
    status: body.status,
    coords: body.coordinates,
    address: body.address,
    logoUrl: body.logo,
  };

  if (body.status === "active") {
    updateData.startPartner = normalizeDate(body.start_partner);
    updateData.endPartner = null;
  } else if (body.status === "inactive") {
    updateData.endPartner = normalizeDate(body.end_partner);
  } else if (body.status === "waitlisted") {
    updateData.startPartner = null;
    updateData.endPartner = null;
  }

  try {
    const partner = await prisma.partner.update({
      where: { id: Number(body.id) },
      data: updateData,
    });

    return NextResponse.json({ data: JSON.parse(stringifyWithBigInt(partner)) });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
=======
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
>>>>>>> 64f60fec961c236a5a7b032abae5565eb4d78132
