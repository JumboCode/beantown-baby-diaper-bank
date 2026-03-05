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
import { status } from "@prisma/client";

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
  coordinates: { lat: number; lng: number }; 
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
  coordinates: { lat: number; lng: number };
  address: string;
  logo?: string;
};

// Helper to ensure dates are saved as the 1st of the month per requirements
const normalizeMonthDate = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
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
  let partnerId: number | undefined;
  let uploadedObjectKey: string | undefined;

  try {
    const { payload, logoAction, logoFile } = await parseCreatePartnerRequest(request);

    // Create the Partner Record
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

    // Map Cities/Regions if provided
    if (payload.cities && payload.cities.length > 0) {
      const cityNames = payload.cities.map((c) => c.city);
      const dbCities = await prisma.city.findMany({
        where: { name: { in: cityNames } },
      });

      const cityIdByName = new Map(dbCities.map((c) => [c.name, c.id]));
      
      await prisma.partnerRegion.createMany({
        data: payload.cities
          .filter(c => cityIdByName.has(c.city))
          .map((city) => ({
            partnerId: partnerId!,
            cityId: cityIdByName.get(city.city)!,
            percentage: city.percentage,
          })),
      });
    }

    // Handle Logo Upload
    let finalLogoUrl = payload.logo || "";
    if (logoAction === "replace" && logoFile) {
      validateLogoFile(logoFile);
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

// Update Partner logic (Using POST)
export async function POST(request: Request) {
  try {
    const { payload, logoAction, logoFile } = await parseUpdatePartnerRequest(request);
    const partnerId = Number(payload.id);
    let uploadedPublicUrl: string | undefined;

    if (logoAction === "replace" && logoFile) {
      validateLogoFile(logoFile);
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

// --- Helpers ---

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