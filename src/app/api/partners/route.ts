import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";

/**
 * GET /api/partners
 *
 * Lists diaper bank partners. Designed as a copy/paste friendly template for any future
 * table you need to expose through this API layer.
 *
 * Query params:
 *   - search: partial, case-insensitive match against the partner name.
 *   - waitlisted: "true" or "false" to filter by waitlist status.
 *   - year: optional filter for related distributions.
 *   - month: optional filter for related distributions.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search");
  const waitlisted = searchParams.get("waitlisted");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: PrismaTypes.PartnerWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (waitlisted === "true" || waitlisted === "false") {
    where.waitlisted = waitlisted === "true";
  }

  try {
    const partners = await prisma.partner.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        distributions: {
          where: {
            ...(year ? { year } : {}),
            ...(month ? { month } : {}),
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    });

    return NextResponse.json({
      data: partners.map((partner) => ({
        id: Number(partner.id),
        created_at: partner.createdAt.toISOString(),
        name: partner.name,
        description: partner.description,
        start_partner: partner.startPartner
          ? partner.startPartner.toISOString()
          : null,
        waitlisted: partner.waitlisted,
        address: partner.address,
        coords: partner.coords,
        logo_url: partner.logoUrl,
        distributions: partner.distributions.map((distribution) => ({
          id: Number(distribution.id),
          created_at: distribution.createdAt.toISOString(),
          partner_id: distribution.partnerId
            ? Number(distribution.partnerId)
            : null,
          city_id: distribution.cityId ? Number(distribution.cityId) : null,
          year: distribution.year,
          month: distribution.month,
          number_diapers: distribution.numberDiapers
            ? Number(distribution.numberDiapers)
            : null,
          number_children: distribution.numberChildren
            ? Number(distribution.numberChildren)
            : null,
          percentage: distribution.percentage,
        })),
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load partners from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
