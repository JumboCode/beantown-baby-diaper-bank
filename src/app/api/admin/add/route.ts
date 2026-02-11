import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// This is a placeholder API route for adding an admin. In a real implementation, you would integrate with your authentication provider (like Clerk) to create a new admin user and assign them the appropriate permissions based on the provided level.
export async function POST(request: Request) {
  const { firstName, lastName, email, level, password } = await request.json();

  if (!firstName || !lastName || !email || !level) {
    return NextResponse.json(
      { message: "Missing required fields: firstName, lastName, email, level" },
      { status: 400 },
    );
  }

  // Add admin to clerk

  const client = await clerkClient();

  console.log("Creating user with email:", email, "and level:", level);
  try {
    const user = await client.users.createUser({
      emailAddress: [email],
      firstName: firstName,
      lastName: lastName,
      ...(typeof password === "string" && password.trim() !== ""
        ? { password: password.trim() }
        : {}),
      publicMetadata: {
        role: level, // Store the admin level in public metadata for later use
      },
    });

    // Here you would also assign the appropriate role/permissions based on the "level" variable
    return NextResponse.json({ message: "User created", user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Error adding admin", error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
