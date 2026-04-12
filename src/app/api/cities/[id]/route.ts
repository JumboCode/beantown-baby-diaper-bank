import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return Response.json({ data: [], error: "Missing ids query param" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length === 0) {
    return Response.json({ data: [], error: "No valid city ids provided" }, { status: 400 });
  }

  try {
    const cities = await prisma.city.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return Response.json({ data: cities });
  } catch (error) {
    console.error("Error fetching cities by ids:", error);
    return Response.json({ data: [], error: "Failed to fetch cities" }, { status: 500 });
  }
}