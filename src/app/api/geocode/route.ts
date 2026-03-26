import { NextResponse } from "next/server";
import { fetchCoordsFromAddress } from "@/lib/server/util";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();

  if (!address) {
    return NextResponse.json(
      { error: "address query param is required" },
      { status: 400 },
    );
  }

  const coords = await fetchCoordsFromAddress(address);

  if (!coords) {
    return NextResponse.json(
      { error: "Unable to geocode address" },
      { status: 502 },
    );
  }

  return NextResponse.json({ data: coords });
}
