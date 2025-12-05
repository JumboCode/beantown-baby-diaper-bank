import { Feature, FeatureCollection, Point } from "geojson";
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

export async function GET() {
  try {
    const result: CityWithCentroid[] = await prisma.$queryRaw`
        SELECT
          "id",
          "name",
          ST_AsGeoJSON("centroid")::json AS centroid
        FROM "Cities"
        WHERE "centroid" IS NOT NULL
        ORDER BY "name"
      `;

    if (!result || result.length === 0) {
      console.log("No city found matching the provided name.");
      return new NextResponse("City not found", { status: 404 });
    }

    const features: Feature<Point>[] = result.map((city) => ({
      type: "Feature",
      geometry: city.centroid,
      properties: {
        name: city.name ?? "Unknown",
        id: Number(city.id),
      },
    }));

    const feature: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features,
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
