import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";
import { month } from "@/generated/prisma/client";

// Helper to ensure dates are saved as the 1st of the month
const normalizeDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const month = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // --- 1. DISTRIBUTION PREVIEW LOGIC ---
    if (mode === "range" || month) {
      let distributions;

      if (mode === "range") {
        const sYear = searchParams.get("startYear") || "0";
        const eYear = searchParams.get("endYear") || "9999";

        distributions = await prisma.distribution.findMany({
          where: { year: { gte: sYear, lte: eYear } },
          include: { partner: true, city: true },
        });
      } else {
        distributions = await prisma.distribution.findMany({
          where: {
            month: month as month,
            year: yearParam || undefined,
          },
          include: { partner: true, city: true },
        });
      }

      // CRITICAL: Use stringifyWithBigInt to prevent the server from hanging on BigInt IDs
      return new NextResponse(stringifyWithBigInt(distributions), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 2. DEFAULT PARTNER TABLE LOGIC ---
    const partners = await prisma.partner.findMany();
    return new NextResponse(stringifyWithBigInt({ data: partners }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("DETAILED SERVER ERROR:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid or missing IDs" }, { status: 400 });
    }

    const numericIds = ids.map((id: any) => Number(id));

    await prisma.distribution.deleteMany({
      where: { id: { in: numericIds } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE Error:", error.message);
    return NextResponse.json({ error: "Failed to delete records" }, { status: 500 });
  }
}

// POST and PUT functions follow the same stringifyWithBigInt pattern...
export async function POST(request: Request) {
  try {
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
    }

    const partner = await prisma.partner.update({
      where: { id: Number(body.id) },
      data: updateData,
    });

    return new NextResponse(stringifyWithBigInt({ data: partner }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("API POST Error:", error.message);
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        address: body.address,
        coords: body.coordinates,
        logoUrl: body.logo,
        startPartner: normalizeDate(body.start_partner),
      }
    });

    return new NextResponse(stringifyWithBigInt({ data: partner }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("API PUT Error:", error.message);
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
