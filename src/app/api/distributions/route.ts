import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

export async function GET(req:Request) {
  const { searchParams } = new URL(req.url);

  const month = searchParams.get("month"); // e.g. "May"
  const year = searchParams.get("year");  // e.g. "2026"
    
  // Build WHERE only when params exist
  const where: PrismaTypes.DistributionWhereInput = {
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };

  const distributionsQuery = {
    where,
    include: {
    partner: { select: { name: true } },
    city: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  } satisfies PrismaTypes.DistributionFindManyArgs;

  type prismaDistributionsReturnType = PrismaTypes.DistributionGetPayload<
    typeof distributionsQuery
  >[];

  try {
    const distributions: prismaDistributionsReturnType =
      await prisma.distribution.findMany(distributionsQuery);

    const formattedData = distributions.map((dist) => ({
      id: dist.id.toString(),
      createdAt: dist.createdAt.toISOString(),
      partnerId: dist.partnerId?.toString() || null,
      cityId: dist.cityId?.toString() || null,
      year: dist.year,
      month: dist.month,
      numberDiapers: dist.numberDiapers?.toString() || null,
      numberChildren: dist.numberChildren?.toString() || null,
      percentage: dist.percentage,
      partner: dist.partner,
      city: dist.city,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching distributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch distributions" },
      { status: 500 }
    );
  }
}

// partner copy-paste
export async function POST(request: Request) {
  const body = await request.json();
  const updatePartnerRequest = {
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description,
      startPartner: new Date(body.start_partner).toISOString(),
      status: body.status as status,
      coords: body.coordinates,
      address: body.address,
      logoUrl: body.logo,
    },
  } as PartnerUpdateArgs;

  console.log("Received partner data:", body);

  try {
    const partner = await prisma.partner.update(updatePartnerRequest);

    return NextResponse.json({
      data: stringifyWithBigInt(partner),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to insert partner into database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
