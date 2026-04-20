import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  const requesterRole = sessionClaims?.metadata?.role;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!["admin", "superadmin"].includes(requesterRole ?? "")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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

export async function DELETE(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const requesterRole = sessionClaims?.metadata?.role;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (requesterRole !== "superadmin") {
      return NextResponse.json(
        { message: "Only superadmin users can delete admin accounts" },
        { status: 403 },
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Missing required field: id" }, { status: 400 });
    }

    const client = await clerkClient();

    await client.users.deleteUser(id);

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      { message: "Error deleting admin", error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
