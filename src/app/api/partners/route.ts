import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";
import type { Partner } from "@/generated/prisma/client";

/**
 * GET /api/partners
 *
 * Lists diaper bank partners from the Partners table. Supports optional
 * filtering by name search and waitlist status.
 *
 * Query params:
 *   - search: partial or case-insensitive match against the partner name.
 *   - waitlisted: "true" or "false" to filter by waitlist status.
 *
 * Example request:
 *  /api/partners?search=arlington&waitlisted=false
 *
 * Example response:
 * ```json{
 *   "data": [
 *    {
 *       "id": 1,
 *       "created_at": "2023-10-01T12:34:56.789Z",
 *       "name": "Arlington Eats",
 *       "description": "A description of Arlington Eats.",
 *       "start_partner": "2023-11-01T00:00:00.000Z",
 *       "waitlisted": false,
 *       "address": "123 Diaper St, Boston, MA",
 *       "coords": { "type": "Point", "coordinates": [-71.0589, 42.3601] },
 *       "logo_url": "https://example.com/logo.png"
 *    }
 *  ]
 * }```
 */
export async function GET(request: Request) {
  // Extract query parameters(checkout dev-example for reference)
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search");
  const waitlisted = searchParams.get("waitlisted");

  // Build the Prisma query filters based on provided params
  // WhereInput type helps ensure we build valid queries
  const where: PrismaTypes.PartnerWhereInput = {};

  if (search) {
    // Case-insensitive partial match on name
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Filter by waitlist status if provided
  if (waitlisted === "true" || waitlisted === "false") {
    where.waitlisted = waitlisted === "true";
  }

  try {
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
      waitlisted: partner.waitlisted,
      address: partner.address,
      coords: partner.coords,
      logo_url: partner.logoUrl,
    }));

    //return the partners as a JSON response
    return NextResponse.json({
      data: dataToReturn,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load partners from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        description: body.description,
        startPartner: body.start_partner,
        waitlisted: body.status,
        coords: body.coordinates,
        address: body.address,
        logoUrl: body.logo
      }
    })

    return NextResponse.json({
      data: partner,
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to insert partner into database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}