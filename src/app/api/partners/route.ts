import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";

// Helper to ensure dates are saved as the 1st of the month per sprint requirements
const normalizeDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

export async function GET() {
  try {
    const partners = await prisma.partner.findMany();
    // Use JSON.parse to fix the "partners.map is not a function" error
    return NextResponse.json({ data: JSON.parse(stringifyWithBigInt(partners)) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

// Add New Partner logic
export async function PUT(request: Request) {
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

    if (!isWaitlisted && body.cities && body.cities.length > 0) {
      const cityNames = body.cities.map((city: any) => city.city);
      const cityIds = await prisma.city.findMany({
        where: { name: { in: cityNames } },
      });

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
  }
}

// Update Partner logic (General)
export async function POST(request: Request) {
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