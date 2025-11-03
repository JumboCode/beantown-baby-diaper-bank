// Dev example of an Next.js API that takes in parameters, performs some calculations, and returns JSON Data.

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract query parameters
  // example: /api/dev-example?name=John
  // would extract name=John
  const { searchParams } = new URL(request.url);

  // Get the 'name' parameter, default to 'World' if not provided
  let name = searchParams.get("name");
  if (!name) {
    name = "World";
  }

  // Create a greeting message
  const message = `Hello, ${name}! This is a dev example API endpoint.`;

  // Return the message as a JSON response, Next.js style

  return NextResponse.json({ message });
}
