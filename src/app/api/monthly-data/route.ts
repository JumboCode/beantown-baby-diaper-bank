import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { MonthlyData, Prisma } from "@/generated/prisma/client";

export async function GET() {
  return new Response(JSON.stringify({ message: "Hello World" }));
}

export async function POST(request: Request) {
  // 
  try {
    const newMonthlyData: MonthlyData[] = await request.json();

    if (!Array.isArray(newMonthlyData)) {
      return NextResponse.json(
        { error: "Expected an array of Monthly Data values" },
        { status: 400 },
      );
    }

    await prisma.monthlyData.createMany({
      data: newMonthlyData,
    });

    return NextResponse.json(
      { message: "Monthly Data values created successfully" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while creating Monthly Data values" },
      { status: 500 },
    );
  }
}
