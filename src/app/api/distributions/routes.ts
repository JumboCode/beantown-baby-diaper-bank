import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Distributions endpoint not implemented yet." },
    { status: 501 }
  );
}
