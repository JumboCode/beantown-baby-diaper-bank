import { NextResponse } from "next/server";
import { revalidateTag, cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { stringifyWithBigInt } from "@/lib/util";
import { PartnerRegionInclude } from "@/generated/prisma/models";

async function getPartnerPercentages(partnerId: string | null, partnerName: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

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
  } else if (partnerName) {
    const partner = await prisma.partner.findFirst({
      where: { name: partnerName },
      select: { id: true },
    });

    if (!partner) {
      return null;
    }

    where.partnerId = partner.id;
  }

  const query: Prisma.PartnerRegionFindManyArgs = {
    include,
    where,
  };

  type returnTy = Prisma.PartnerRegionGetPayload<typeof query>;

  const partnerRegions: returnTy[] = await prisma.partnerRegion.findMany(query);

  return partnerRegions;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId");
  const partnerName = url.searchParams.get("partnerName");

  try {
    const partnerRegions = await getPartnerPercentages(partnerId, partnerName);

    if (partnerRegions === null) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data_response = stringifyWithBigInt({ data: partnerRegions });

    return new Response(data_response, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching partner regions:", error);
    return NextResponse.json({ status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, percentages } = body as {
      partnerId?: string;
      percentages?: Array<{ city?: string; percentage?: number }>;
    };

    if (!partnerId || !Array.isArray(percentages) || percentages.length === 0) {
      return NextResponse.json(
        { error: "Missing partnerId or percentages array" },
        { status: 400 },
      );
    }

    let pId: bigint;

    try {
      pId = BigInt(partnerId);
    } catch {
      return NextResponse.json({ error: "Invalid partnerId" }, { status: 400 });
    }

    const normalizedPercentages = percentages.map((item) => ({
      city: typeof item.city === "string" ? item.city.trim() : "",
      percentage: item.percentage,
    }));

    if (
      normalizedPercentages.some(
        (item) =>
          !item.city ||
          typeof item.percentage !== "number" ||
          !Number.isFinite(item.percentage) ||
          item.percentage < 0 ||
          item.percentage > 1,
      )
    ) {
      return NextResponse.json({ error: "Invalid city or percentage" }, { status: 400 });
    }

    const validatedPercentages: Array<{ city: string; percentage: number }> =
      normalizedPercentages.map((item) => ({
        city: item.city,
        percentage: item.percentage as number,
      }));

    const normalizedCityNames = validatedPercentages.map((item) => item.city.toLowerCase());
    if (new Set(normalizedCityNames).size !== normalizedCityNames.length) {
      return NextResponse.json({ error: "Duplicate cities in payload" }, { status: 400 });
    }

    const totalPercentage = validatedPercentages.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 1) > 1e-9) {
      return NextResponse.json({ error: "Percentages must sum to 1" }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: pId },
      select: { id: true },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const cities = await prisma.city.findMany({
      where: { name: { in: validatedPercentages.map((item) => item.city) } },
      select: { id: true, name: true },
    });

    const cityIdByName = new Map(cities.map((city) => [city.name?.trim().toLowerCase(), city.id]));

    if (validatedPercentages.some((item) => !cityIdByName.has(item.city.toLowerCase()))) {
      return NextResponse.json(
        { error: "One or more payload cities not found in DB" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.partnerRegion.deleteMany({
        where: { partnerId: pId },
      }),
      prisma.partnerRegion.createMany({
        data: validatedPercentages.map((item) => ({
          partnerId: pId,
          cityId: cityIdByName.get(item.city.toLowerCase())!,
          percentage: item.percentage,
        })),
      }),
    ]);
    revalidateTag("cities", "max");

    return NextResponse.json({
      success: true,
      message: "Continuous percentages updated",
    });
  } catch (error) {
    console.error("Error updating continuous percentages:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
