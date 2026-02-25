import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { month, Prisma } from "@/generated/prisma/client";

export async function GET() {
  return new Response(JSON.stringify({ message: "Hello World" }));
}

type MonthlyDataPostInput = {
  partnerId: string | number;
  year: string;
  month: month;
  numDiapers?: string | number | null;
  numBabies?: string | number | null;
};

export async function POST(request: Request) {
  try {
    const newMonthlyData = (await request.json()) as MonthlyDataPostInput[];

    if (!Array.isArray(newMonthlyData)) {
      return NextResponse.json(
        { error: "Expected an array of Monthly Data values" },
        { status: 400 },
      );
    }

    const data: Prisma.MonthlyDataCreateManyInput[] = newMonthlyData.map(
      (row) => ({
        id: crypto.randomUUID(),
        partnerId: BigInt(row.partnerId),
        year: row.year,
        month: row.month,
        numDiapers:
          row.numDiapers === null || row.numDiapers === undefined
            ? null
            : BigInt(row.numDiapers),
        numBabies:
          row.numBabies === null || row.numBabies === undefined
            ? null
            : BigInt(row.numBabies),
      }),
    );

    await prisma.monthlyData.createMany({
      data,
    });

    return NextResponse.json(
      { message: "Monthly Data values created successfully" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "An error occurred while creating Monthly Data values" },
      { status: 500 },
    );
  }
}
