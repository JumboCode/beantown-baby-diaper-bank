import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: Number(id) },
    });

    const aggregate = await prisma.distribution.aggregate({
      where: { partnerId: Number(id) },
      _sum: {
        numberDiapers: true,
        numberChildren: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const dataToReturn = {
      partner_id: Number(partner.id),
      name: partner.name,
      description: partner.description,
      logo_url: partner.logoUrl,
      coordinates: partner.coords,
      address: partner.address,
      status: partner.status,
      start_partner: partner.startPartner
        ? partner.startPartner.toDateString()
        : null,
      number_babies_helped: Number(aggregate._sum.numberChildren),
      number_diapers: Number(aggregate._sum.numberDiapers),
    };

    return NextResponse.json({ data: dataToReturn });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load partners from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
