// src/app/api/yearly-data/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";
async function totalDiapers() {
  const result = await prisma.yearlyData.aggregate({
    _sum: { numDiapers: true },
  });
  return result._sum.numDiapers ?? 0;
}

export async function GET() {
  const total = await totalDiapers();
  return new NextResponse(stringifyWithBigInt({ totalDiapers: total }), {
    headers: { "content-type": "application/json" },
  });
}
export { totalDiapers };
