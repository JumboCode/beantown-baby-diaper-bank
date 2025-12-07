import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.yearlyData.aggregate({
      _sum: { numDiapers: true },
    });

    const totalDiapers =
      results._sum.numDiapers == null ? 0 : Number(results._sum.numDiapers);

    console.log("this is the number of diapers:", totalDiapers);

    return NextResponse.json({ totalDiapers });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load yearly data from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
