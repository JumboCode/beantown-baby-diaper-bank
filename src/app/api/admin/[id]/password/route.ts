import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const client = await clerkClient();

    const updatedUser = await client.users.updateUser(id, {
      password: trimmedPassword,
      signOutOfOtherSessions: true,
    });

    return NextResponse.json({
      message: "Password updated successfully",
      userId: updatedUser.id,
    });
  } catch (err: any) {
    console.error("Password update error:", err);

    const clerkErrors = err?.errors || err?.clerkError?.errors;

    if (clerkErrors) {
      return NextResponse.json(
        {
          message: "Clerk error updating password",
          errors: clerkErrors,
        },
        { status: err?.status || 422 },
      );
    }

    return NextResponse.json(
      {
        message: "Error updating password",
        error: err?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
