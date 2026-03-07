import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 2592000;

export async function GET() {
  try {
    const yearly_data = await prisma.yearlyData.findMany({
      distinct: ["year"],
      orderBy: {
        year: "asc",
      },
    });

    const years = yearly_data.map((yearlyData) => yearlyData.year);

    const distributions = await prisma.distribution.findMany({
      distinct: ["year", "month"],
    });

    const months = distributions.map((distribution) => ({
      Month: distribution.month,
      Year: distribution.year,
    }));

    return NextResponse.json({ years, months });
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    console.log("Unable to load timeline data from the database");
    return NextResponse.json(
      { error: "Unable to load timeline data from the database" },
      { status: 500 },
    );
  }
}
