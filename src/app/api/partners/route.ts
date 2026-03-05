import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";
import {
  deleteLogoObject,
  FileUploadError,
  getLogoObjectKey,
  uploadLogoForPartner,
  validateImageSignature,
  validateLogoFile,
} from "@/lib/server/logoUpload";
import { status, Partner, City } from "@prisma/client"; // Ensure these are imported from your client

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
  coordinates: any; 
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
  coordinates: any;
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

// Helper to ensure dates are saved as the 1st of the month per requirements
const normalizeMonthDate = (value: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) return new Date(value).toISOString(); // Fallback for standard ISO strings

  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
};

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { name: "asc" },
    });

    const dataToReturn = partners.map((partner: any) => ({
      id: Number(partner.id),
      created_at: partner.createdAt.toISOString(),
      name: partner.name,
      description: partner.description,
      start_partner: partner.startPartner ? partner.startPartner.toISOString() : null,
      end_partner: partner.endPartner ? partner.endPartner.toISOString() : null,
      status: partner.status,
      address: partner.address,
      coords: partner.coords,
      logo_url: partner.logoUrl,
    }));

    return NextResponse.json({ data: dataToReturn });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

// Add New Partner logic
export async function PUT(request: Request) {
  let payload: CreatePartnerPayload;
  let logoAction: LogoAction;
  let logoFile: File | null;

  try {
    const parsed = await parseCreatePartnerRequest(request);
    payload = parsed.payload;
    logoAction = parsed.logoAction;
    logoFile = parsed.logoFile;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid request" }, { status: 400 });
  }

  let partnerId: number | undefined;
  let uploadedObjectKey: string | undefined;

  try {
    // 1. Create the Partner
    const partner = await prisma.partner.create({
      data: {
        name: payload.name,
        description: payload.description,
        startPartner: normalizeMonthDate(payload.start_partner),
        status: payload.status,
        coords: payload.coordinates,
        address: payload.address,
        logoUrl: "",
      },
    });

    partnerId = Number(partner.id);

    // 2. Handle Cities/Regions
    if (payload.cities && payload.cities.length > 0) {
      const cityNames = payload.cities.map((c) => c.city);
      const dbCities = await prisma.city.findMany({
        where: { name: { in: cityNames } },
      });

      const cityIdByName = new Map(dbCities.map((c) => [c.name, c.id]));
      
      await prisma.partnerRegion.createMany({
        data: payload.cities.map((city) => ({
          partnerId: partnerId!,
          cityId: cityIdByName.get(city.city)!,
          percentage: city.percentage,
        })),
      });
    }

    // 3. Handle Logo Upload
    let finalLogoUrl = payload.logo || "";
    if (logoAction === "replace" && logoFile) {
      validateLogoFile(logoFile);
      await validateImageSignature(logoFile);
      const uploadResult = await uploadLogoForPartner(partnerId, logoFile);
      uploadedObjectKey = uploadResult.objectKey;
      finalLogoUrl = uploadResult.publicUrl;

      await prisma.partner.update({
        where: { id: partnerId },
        data: { logoUrl: finalLogoUrl },
      });
    }

    return NextResponse.json({ data: stringifyWithBigInt({ ...partner, logoUrl: finalLogoUrl }) });
  } catch (error: any) {
    if (partnerId) await cleanupPartnerCreate(partnerId, uploadedObjectKey);
    return NextResponse.json({ error: error.message || "Failed to create partner" }, { status: 500 });
  }
}

// Update Partner logic
export async function POST(request: Request) {
  try {
    const { payload, logoAction, logoFile } = await parseUpdatePartnerRequest(request);
    const partnerId = Number(payload.id);
    let uploadedPublicUrl: string | undefined;

    if (logoAction === "replace" && logoFile) {
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
        startPartner: normalizeMonthDate(payload.start_partner),
        endPartner: normalizeMonthDate(payload.end_partner ?? null),
        status: payload.status,
        coords: payload.coordinates,
        address: payload.address,
        logoUrl: logoAction === "replace" ? uploadedPublicUrl : (logoAction === "remove" ? "" : payload.logo),
      },
    });

    if (logoAction === "remove") {
      await deleteLogoObject(getLogoObjectKey(partnerId)).catch(() => undefined);
    }

    return NextResponse.json({ data: stringifyWithBigInt(partner) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update partner" }, { status: 500 });
  }
}

// --- Parsing Helpers ---

async function parseCreatePartnerRequest(request: Request) {
  const formData = await request.formData();
  const payload = JSON.parse(formData.get("partner") as string) as CreatePartnerPayload;
  const logoAction = (formData.get("logoAction") as LogoAction) || "keep";
  const logoFile = formData.get("file") as File | null;
  return { payload, logoAction, logoFile };
}

async function parseUpdatePartnerRequest(request: Request) {
  const formData = await request.formData();
  const payload = JSON.parse(formData.get("partner") as string) as UpdatePartnerPayload;
  const logoAction = (formData.get("logoAction") as LogoAction) || "keep";
  const logoFile = formData.get("file") as File | null;
  return { payload, logoAction, logoFile };
}

async function cleanupPartnerCreate(partnerId: number, objectKey?: string) {
  if (objectKey) await deleteLogoObject(objectKey).catch(() => undefined);
  await prisma.partnerRegion.deleteMany({ where: { partnerId } });
  await prisma.partner.delete({ where: { id: partnerId } });
}