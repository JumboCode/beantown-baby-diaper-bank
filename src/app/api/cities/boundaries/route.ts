import { NextResponse } from "next/server";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { prisma } from "@/lib/prisma";
import { City } from "@/generated/prisma/client";
import { cacheLife, cacheTag } from "next/cache";

type RawCityWithBoundaries = Omit<City, "boundary"> & {
  boundary: string;
};

export type CityWithBoundaries = Omit<City, "boundary"> & {
  boundary: Polygon | MultiPolygon;
};

async function getCityBoundaries() {
  "use cache";
  cacheTag("cities-v2");
  cacheLife("max");

  const result: RawCityWithBoundaries[] = await prisma.$queryRaw`
    SELECT
      c1.id,
      c1.name,
      ST_AsGeoJSON(
        ST_CollectionExtract(
          COALESCE(
            ST_Difference(
              c1.boundary::geometry,
              (
                SELECT ST_Union(c2.boundary::geometry)
                FROM "Cities" c2
                WHERE c2.id != c1.id
                  AND ST_Intersects(c1.boundary, c2.boundary)
                  AND ST_Area(c1.boundary::geometry) > ST_Area(c2.boundary::geometry)
              )
            ),
            c1.boundary::geometry
          ),
          3
        )
      ) AS boundary
    FROM "Cities" c1
    WHERE c1.boundary IS NOT NULL
    ORDER BY c1.name
  `;

  if (!result || result.length === 0) {
    console.warn("[boundaries] No cities with boundary data found in the database.");
    return null;
  }

  const citiesFormatted: CityWithBoundaries[] = result.map((city) => {
    try {
      return {
        ...city,
        boundary: JSON.parse(city.boundary) as Polygon | MultiPolygon,
      };
    } catch (parseError) {
      console.error(
        `[boundaries] Failed to parse boundary GeoJSON for city "${city.name}" (id=${city.id}):`,
        parseError,
      );
      throw new Error(`Invalid boundary geometry for city "${city.name}"`);
    }
  });

  const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
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

  return featureCollection;
}

export async function GET() {
  try {
    const featureCollection = await getCityBoundaries();

    if (!featureCollection) {
      console.warn("[boundaries] GET /api/cities/boundaries - 404: no boundary data seeded");
      return NextResponse.json(
        { error: "No city boundary data found. The database may not be seeded." },
        { status: 404 },
      );
    }

    console.log(`[boundaries] Returning ${featureCollection.features.length} city boundaries`);
    return NextResponse.json(featureCollection);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[boundaries] GET /api/cities/boundaries - 500:", message, error);
    return NextResponse.json(
      { error: `Failed to load city boundaries: ${message}` },
      { status: 500 },
    );
  }
}
