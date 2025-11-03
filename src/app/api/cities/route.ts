// TODO: Implement city API endpoint

import { NextResponse } from "next/server";


export async function GET() {
  return NextResponse.json(
    { message: "City API endpoint not implemented yet." },
    { status: 501 }
  );
}
