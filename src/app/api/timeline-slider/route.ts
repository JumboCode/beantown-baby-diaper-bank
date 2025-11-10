import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try{
        const yearly_data = await prisma.yearlyData.findMany( 
            {
                distinct: ['year'], 
            }
        );

        const years = yearly_data.map((yearlyData) => (yearlyData.year));

        const distributions = await prisma.distribution.findMany(
            {
                distinct: ['year', 'month'], 
            }
        );

        const months = distributions.map((distribution) =>(
            {
                Month: distribution.month,
                Year: distribution.year
            }
        ));

        return NextResponse.json({ years, months });
    }
    catch(error){
        console.log("Unable to load timeline data from the database");

        return NextResponse.json({ status: 500 });
    }
}