import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("Partner ID:", id);
  return NextResponse.json({ message: "Not implemented yet." });
}
