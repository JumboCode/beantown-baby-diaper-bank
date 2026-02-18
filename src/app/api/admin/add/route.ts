import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// This is a placeholder API route for adding an admin. In a real implementation, you would integrate with your authentication provider (like Clerk) to create a new admin user and assign them the appropriate permissions based on the provided level.
export async function POST(request: Request) {
  const { firstName, lastName, email, level, password } = await request.json();
  console.log("Received request to add admin with email:", email, "and level:", level);

  if (!firstName || !lastName || !email || !level) {
    return NextResponse.json(
      { message: "Missing required fields: firstName, lastName, email, level" },
      { status: 400 },
    );
  }

  // Add admin to clerk
  const client = await clerkClient();
  // const client = await clerkClient.users.createUser(...);

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
    console.log("User created with ID:", user.id, "and role:", user.publicMetadata.role);
    return NextResponse.json({ message: "User created", user });
  } catch (err: any) {
    const clerkErrors = err?.errors || err?.clerkError?.errors;

    if (clerkErrors) {
      return NextResponse.json(
        {
          message: "Clerk error creating user",
          errors: clerkErrors,
        },
        { status: err?.status || 422 }
      );
    }

    return NextResponse.json(
      { message: "Error adding admin", error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
