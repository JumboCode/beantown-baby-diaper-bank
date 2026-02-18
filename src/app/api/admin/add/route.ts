import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const { firstName, lastName, email, level, password } = await request.json();
  
  if (!firstName || !lastName || !email || !level) {
    return NextResponse.json(
      { message: "Missing required fields: firstName, lastName, email, level" },
      { status: 400 },
    );
  }
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

    return NextResponse.json({ message: "User created", user });
  } catch (err: any) {
    const clerkErrors = err?.errors || err?.clerkError?.errors;

    if (clerkErrors) {
      return NextResponse.json(
        {
          message: "Clerk error creating user",
          errors: clerkErrors,
        },
        { status: err?.status || 422 },
      );
    }

    return NextResponse.json(
      { message: "Error adding admin", error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
