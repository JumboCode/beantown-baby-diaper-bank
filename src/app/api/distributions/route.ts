import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
 try {
    const distributions = await prisma.distribution.findMany({
      include: {
        partner: {
          select: {
            name: true
          }
        },
        city: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedData = distributions.map(dist => ({
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
      city: dist.city
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
