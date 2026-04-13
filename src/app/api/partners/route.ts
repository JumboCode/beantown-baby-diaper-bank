import { NextResponse } from "next/server";
import { revalidateTag, cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes, status } from "@/generated/prisma/client";
import type { Partner } from "@/generated/prisma/client";
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

// Shared payload type — `id` absent means create, present means update
type PartnerPayload = {
  id?: number;
  name: string;
  description: string;
  start_partner: string | null;
  end_partner?: string | null;
  status: status;
  coordinates: PrismaTypes.InputJsonValue;
  address: string;
  logo?: string;
  cities?: CityPercentage[]; // required for create, ignored for update
};

class PartnerRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function getPartners(search: string | null, waitlisted: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  const where: PrismaTypes.PartnerWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
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
    logoUrl: partner.logoUrl,
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

/**
 * POST /api/partners
 *
 * Create:  payload has no `id` — creates partner + PartnerRegion rows.
 *          Cities must already exist in the DB (created upfront via POST /api/cities).
 *
 * Update:  payload has an `id` — updates partner details only.
 *          City percentages are managed separately via POST /api/partners/percentages.
 */
export async function POST(request: Request) {
  let payload: PartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  try {
    const parsed = await parseRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;

    if (logoAction === "replace") {
      if (!logoFile) throw new PartnerRequestError("File required when logoAction is replace", 400);
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
    }
  } catch (error) {
    if (error instanceof PartnerRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  return payload.id === undefined
    ? createPartner(
        payload as Required<Pick<PartnerPayload, "cities">> & PartnerPayload,
        logoAction,
        logoFile,
      )
    : updatePartner(payload as PartnerPayload & { id: number }, logoAction, logoFile);
}

// --- Create ---

async function createPartner(
  payload: PartnerPayload & { cities: CityPercentage[] },
  logoAction: LogoAction,
  logoFile: File | null,
) {
  const cityNames = Array.from(
    new Set(payload.cities.map((c) => c.city.trim()).filter((n) => n.length > 0)),
  );

  let cityIdByName = new Map<string, bigint>();

  if (cityNames.length > 0) {
    try {
      const cities = await prisma.city.findMany({
        where: {
          OR: cityNames.map((name) => ({ name: { equals: name, mode: "insensitive" as const } })),
        },
        select: { id: true, name: true },
      });

      cityIdByName = new Map(
        cities
          .filter((c): c is typeof c & { name: string } => Boolean(c.name))
          .map((c) => [c.name.trim().toLowerCase(), c.id]),
      );

      const missing = cityNames.filter((n) => !cityIdByName.has(n.toLowerCase()));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Cities not found in database: ${missing.join(", ")}` },
          { status: 422 },
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to look up cities";
      return NextResponse.json({ error: message }, { status: 500 });
    }
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

      if (payload.cities.length > 0) {
        const rows = payload.cities.map((city) => {
          const cityId = cityIdByName.get(city.city.trim().toLowerCase());
          if (!cityId) throw new PartnerRequestError("Please check the entered cities.", 422);
          return { partnerId, cityId, percentage: city.percentage };
        });
        await tx.partnerRegion.createMany({ data: rows });
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
    const partnerId = Number(partner.id);
    try {
      const { publicUrl } = await uploadLogoForPartner(partnerId, logoFile!);
      partner = await prisma.partner.update({
        where: { id: partner.id },
        data: { logoUrl: publicUrl },
      });
    } catch (error) {
      // Best-effort cleanup: delete the partner record and any regions
      await prisma
        .$transaction([
          prisma.partnerRegion.deleteMany({ where: { partnerId } }),
          prisma.partner.delete({ where: { id: partner.id } }),
        ])
        .catch((e) => console.error("Cleanup after logo upload failure failed:", e));
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
      const message = error instanceof Error ? error.message : "Unable to upload logo.";
      const statusCode = error instanceof FileUploadError ? error.status : 500;
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  }

  revalidateTag("cities", "max");
  return NextResponse.json({ data: stringifyWithBigInt(partner) }, { status: 201 });
}

// --- Update ---

async function updatePartner(
  payload: PartnerPayload & { id: number },
  logoAction: LogoAction,
  logoFile: File | null,
) {
  const partnerId = payload.id;

  // Resolve final logoUrl before touching the DB
  let logoUrl = payload.logo ?? "";
  if (logoAction === "replace") {
    try {
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile!);
      logoUrl = uploadResult.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload logo.";
      const statusCode = error instanceof FileUploadError ? error.status : 500;
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  } else if (logoAction === "remove") {
    logoUrl = "";
    await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
  }

  try {
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        name: payload.name,
        description: payload.description,
        startPartner: normalizeMonthDate(payload.start_partner),
        endPartner: normalizeMonthDate(payload.end_partner ?? null),
        status: payload.status,
        coords: payload.coordinates,
        address: payload.address,
        logoUrl,
      },
    });

    revalidateTag("cities", "max");
    return NextResponse.json({ data: stringifyWithBigInt(partner) });
  } catch (error) {
    if (logoAction === "replace") {
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
    }
    const message =
      error instanceof Error ? error.message : "Unable to update partner in database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- Helpers ---

function normalizeMonthDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)).toISOString();
  }

  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) throw new PartnerRequestError("Invalid date format", 400);

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new PartnerRequestError("Invalid date value", 400);
  }

  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
}

function parseLogoAction(raw: FormDataEntryValue | null): LogoAction {
  if (raw === null) return "keep";
  if (typeof raw !== "string") throw new PartnerRequestError("Invalid logoAction field", 400);
  if (raw !== "keep" && raw !== "replace" && raw !== "remove") {
    throw new PartnerRequestError("logoAction must be keep, replace, or remove", 400);
  }
  return raw;
}

function assertPayload(payload: unknown): asserts payload is PartnerPayload {
  if (!payload || typeof payload !== "object") {
    throw new PartnerRequestError("Invalid partner payload", 400);
  }
  const p = payload as Partial<PartnerPayload>;
  if (!p.name || !p.description || !p.status || !p.address) {
    throw new PartnerRequestError("Missing required partner fields", 400);
  }
  // Create: no id → cities array required
  if (p.id === undefined && !Array.isArray(p.cities)) {
    throw new PartnerRequestError("cities is required when creating a partner", 400);
  }
  // Update: id must be a number
  if (p.id !== undefined && typeof p.id !== "number") {
    throw new PartnerRequestError("id must be a number", 400);
  }
}

async function parseRequest(request: Request): Promise<{
  payload: PartnerPayload;
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

    assertPayload(parsed);

    const logoAction = parseLogoAction(formData.get("logoAction"));
    if (parsed.id === undefined && logoAction === "remove") {
      throw new PartnerRequestError("logoAction remove is invalid for create", 400);
    }

    const fileRaw = formData.get("file");
    const logoFile = fileRaw instanceof File ? fileRaw : null;

    return { payload: parsed, logoAction, logoFile };
  }

  const body = (await request.json()) as unknown;
  assertPayload(body);
  return { payload: body, logoAction: "keep", logoFile: null };
}
