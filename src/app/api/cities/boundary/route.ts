// Future implementation for city boundary API endpoint
// TODO: Implement city boundary retrieval logic here
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "City boundary endpoint not implemented yet." },
    { status: 501 },
  );
}
