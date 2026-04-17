import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

async function getCityNames() {
  "use cache";
  cacheTag("cities");
  cacheLife({ revalidate: 2592000, stale: 604800 });
  const cities = await prisma.city.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return cities.map((c) => c.name);
}

export async function GET() {
  const data = await getCityNames();
  return Response.json({ data });
}
