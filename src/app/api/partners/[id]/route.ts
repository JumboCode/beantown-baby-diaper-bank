import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";
import { PartnerInclude } from "@/generated/prisma/models";

const normalizeDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

async function getPartnerById(id: string) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  const partnerIncludeClause = {
    partnerRegions: {
      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  } satisfies PartnerInclude;

  const partner = await prisma.partner.findUnique({
    where: { id: Number(id) },
    include: partnerIncludeClause,
  });

  if (!partner) {
    return null;
  }

  const aggregate = await prisma.distribution.aggregate({
    where: { partnerId: Number(id) },
    _sum: {
      numberDiapers: true,
      numberChildren: true,
    },
  });

  return {
    partner_id: Number(partner.id),
    name: partner.name,
    description: partner.description,
    logoUrl: partner.logoUrl,
    coordinates: partner.coords,
    address: partner.address,
    status: partner.status,
    startPartner: partner.startPartner,
    endPartner: partner.endPartner,
    number_babies_helped: Number(aggregate._sum.numberChildren),
    number_diapers: Number(aggregate._sum.numberDiapers),
    citiesServed: partner.partnerRegions.map((pr) => ({
      id: pr.city?.id,
    })),
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const data = await getPartnerById(id);

    if (!data) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: JSON.parse(stringifyWithBigInt(data)),
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load partner" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updateData: any = {
    name: body.name,
    description: body.description,
    status: body.status,
    address: body.address,
    coords: body.coordinates,
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
    const updatedPartner = await prisma.partner.update({
      where: { id: Number(id) },
      data: updateData,
    });

    revalidateTag("cities", "max");
    return NextResponse.json({
      data: JSON.parse(stringifyWithBigInt(updatedPartner)),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
  }
}
