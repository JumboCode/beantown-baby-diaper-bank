// TODO: Implement yearly data API endpoint
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Yearly data API endpoint not implemented yet." },
    { status: 501 },
  );
}
