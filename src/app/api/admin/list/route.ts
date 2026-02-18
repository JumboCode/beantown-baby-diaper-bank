import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList();

    const admins = users.data
      .map((u) => {
        const role =
          (u.publicMetadata?.role as string | undefined) ?? "standard";

        const isAdmin = ["admin"].includes(role.toLowerCase());

        return {
          id: u.id,
          name:
            [u.firstName, u.lastName].filter(Boolean).join(" ") || "(No name)",
          email: u.emailAddresses?.[0]?.emailAddress ?? "",
          level: role,
          isAdmin,
        };
      })
      .filter((x) => x.isAdmin);

    console.log("Fetched admins:", admins);

    return NextResponse.json({ admins });
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Failed to list admins",
        error: err?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
