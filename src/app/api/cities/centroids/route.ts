// Future implementation for city centroid API endpoint
// TODO: Implement city centroid retrieval logic here

import { NextResponse } from "next/server";

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

  return new NextResponse("API endpoint is being developed.", {
    status: 501,
  });
}
