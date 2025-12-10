import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PartnerRegion, Prisma } from "@/generated/prisma/client";
import { stringifyWithBigInt } from "@/lib/util";
import { PartnerRegionInclude } from "@/generated/prisma/models";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId");

  try {
    const include = {
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    } satisfies PartnerRegionInclude;

    const where: Prisma.PartnerRegionWhereInput = {};

    if (partnerId) {
      where.partnerId = BigInt(partnerId);
    }

    const query: Prisma.PartnerRegionFindManyArgs = {
      include,
      where,
    };

    type returnTy = Prisma.PartnerRegionGetPayload<typeof query>;

    const partnerRegions: returnTy[] =
      await prisma.partnerRegion.findMany(query);

    const data_response = stringifyWithBigInt({ data: partnerRegions });

    return new Response(data_response, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching partner regions:", error);
    console.log("Unable to fetch partner regions");
    return NextResponse.json({ status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newPercentages: PartnerRegion[] = await request.json();

    if (!Array.isArray(newPercentages)) {
      return NextResponse.json(
        { error: "Expected an array of PartnerRegion values" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      newPercentages.map((p) =>
        prisma.partnerRegion.update({
          where: {
            partnerId_cityId: {
              partnerId: p.partnerId,
              cityId: p.cityId,
            },
          },
          data: {
            percentage: p.percentage,
          },
        }),
      ),
    );

    const data_response = stringifyWithBigInt({ data: newPercentages });

    return new Response(data_response, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating percentages:", error);
    console.log("Unable to update percentages");
    return NextResponse.json({ status: 500 });
  }
}
