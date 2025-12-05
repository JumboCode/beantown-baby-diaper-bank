// Future implementation for city boundary API endpoint
// TODO: Implement city boundary retrieval logic here
import { NextResponse } from "next/server";
import { FeatureCollection, Polygon } from "geojson";
import { prisma } from "@/lib/prisma";
import { City } from "@/generated/prisma/client";

type RawCityWithBoundaries = Omit<City, 'boundary'> & {
  boundary: string,
}

export type CityWithBoundaries = Omit<City, 'boundary'> & {
  boundary: Polygon,
}

export async function GET() {
  try {
    const result: RawCityWithBoundaries[] = await prisma.$queryRaw `
      SELECT 
        "id",
        "name",
        ST_AsGeoJSON("boundary") AS boundary
      FROM "Cities"
      WHERE "boundary" IS NOT NULL
      ORDER BY "name"
    `;
    
    if (!result || result.length === 0) {
      return new NextResponse ("No cities are found", { status: 200 });
    }

    const citiesFormatted: CityWithBoundaries[] = result.map((city) => ({
      ...city,
      boundary: JSON.parse(city.boundary) as Polygon,
    }))

    const featureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: citiesFormatted.map((city) => ({
        type: "Feature",
        id: city.id.toString(),
        properties: {
          name: city.name,
          createdAt: city.createdAt,
        },
        geometry: city.boundary,
      })),
    };

    return NextResponse.json(featureCollection);

  } catch (error) {
    console.error("Error fetching city centroid data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
