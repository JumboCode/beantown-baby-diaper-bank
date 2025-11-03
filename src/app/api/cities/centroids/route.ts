// Future implementation for city centroid API endpoint
// TODO: Implement city centroid retrieval logic here
import { prisma } from "@/lib/prisma";

import { stringifyWithBigInt } from "@/lib/util";

import { NextResponse } from "next/server";

import {GeoJSON, GeoJsonObject, GeoJsonTypes, Feature, Geometry, Point} from "geojson";
import { City } from "@/generated/prisma/client";

export type CityWithCentroid = City & {
  name: string,
  id: number,

  centroid: Point,
}

/**
 * GET /api/cities/centroids
 *
 * Returns city centroid data for geographic context.
 * @param request The incoming request object.
 *  - name: case-insensitive lookup for the city name.
 * @returns A GEOJSON response containing the city centroid data.
 * Example response:
 * {
 *   "data": {
 *     "type": "FeatureCollection",
 *     "features": [
 *       {
 *         "type": "Feature",
 *         "geometry": {
 *           "type": "Point",
 *           "coordinates": [-71.0589, 42.3601]
 *         },
 *         "properties": {
 *           "name": "Boston",
 *         }
 *       }
 *     ]
 *   }
 * }
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("Received request for city centroid with params:", searchParams);

  try {
    const result: CityWithCentroid = await prisma.$queryRaw`
        SELECT
          "id",
          "name",
          ST_AsGeoJSON("centroid")::json AS centroid
        FROM "Cities"
        WHERE "centroid" IS NOT NULL AND "name" ILIKE '%' || ${searchParams.get("name")} || '%'
      `;
      console.log("City centroid data retrieved:", result);

      const point: Feature = {
        type: "Feature",
        geometry: result.centroid,
        properties: {
          id: result.id,
          name: result.name,
        },
      }

      console.log(point)

      return new NextResponse(stringifyWithBigInt(point), {
        status: 200,
      });
  } catch (error) {
    console.error("Error fetching city centroid data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
