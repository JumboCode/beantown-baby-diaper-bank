import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PartnerRegion } from "@/generated/prisma/client";
import { stringifyWithBigInt } from "@/lib/util";

export async function GET(request: Request) {
  try{
    const partnerRegions: PartnerRegion[]  = await prisma.partnerRegion.findMany();

    const data_response = stringifyWithBigInt({data: partnerRegions});
    
    return new Response(data_response, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }
  catch(error){
    console.log("Unable to fetch partner regions");

    return NextResponse.json({ status: 500 });
  }
}
