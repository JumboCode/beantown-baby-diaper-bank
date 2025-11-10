import { Feature, Point } from "geojson";
import { NextResponse } from "next/server";

import { City } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stringifyWithBigInt } from "@/lib/util";

export type CityWithCentroid = City & {
  centroid: Point;
};

/**
 * GET /api/cities/centroids
 *
 * Returns city centroid data for geographic context.
 * @param request The incoming request object.
 *  - name: case-insensitive lookup for the city name.
 * @returns A GEOJSON response containing the city centroid data.
 * Example response:
 * {
 *         "type": "Feature",
 *         "geometry": {
 *           "type": "Point",
 *           "coordinates": [-71.0589, 42.3601]
 *         },
 *         "properties": {
 *           "name": "Boston",
 *          "id": 1
 *         }
 *   }
 * }
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("Received request for city centroid with params:", searchParams);

  try {
    const result: CityWithCentroid[] = await prisma.$queryRaw`
        SELECT
          "id",
          "name",
          ST_AsGeoJSON("centroid")::json AS centroid
        FROM "Cities"
        WHERE "centroid" IS NOT NULL AND "name" ILIKE '%' || ${searchParams.get("name")} || '%'
        ORDER BY "name"
        LIMIT 1
      `;

    const processedResult = result[0];

    if (!processedResult) {
      console.log("No city found matching the provided name.");
      return new NextResponse("City not found", { status: 404 });
    }

    const feature: Feature<Point, { name: string; id: number }> = {
      type: "Feature",
      geometry: processedResult.centroid,
      properties: {
        name: processedResult.name ?? "Unknown",
        id: Number(processedResult.id),
      },
    };

    const data_response = stringifyWithBigInt(feature);

    return new NextResponse(data_response, {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching city centroid data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
