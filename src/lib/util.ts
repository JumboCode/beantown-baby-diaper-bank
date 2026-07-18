import type { LatLngExpression } from "leaflet";
import type { Geometry } from "geojson";

/**
 * Flattens a GeoJSON Polygon or MultiPolygon into a flat list of rings
 * (LatLngExpression[][]) that Leaflet's <Polygon> expects. Polygon and
 * MultiPolygon coordinates differ by one level of nesting (MultiPolygon
 * adds a per-polygon wrapper array), so a feature's geometry.type must be
 * checked before casting — treating both the same way misaligns the
 * nesting depth and crashes Leaflet's ring renderer.
 *
 * Some seeded city boundaries fall back to a Point geometry when no
 * polygon boundary was imported (e.g. Foxboro, Roslindale). Those aren't
 * renderable as a polygon, so they return an empty ring list rather than
 * crashing Leaflet on malformed coordinates.
 */
export function geoJsonToRingPositions(
  geometry: Geometry | null | undefined,
): LatLngExpression[][] {
  if (!geometry) return [];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat() as unknown as LatLngExpression[][];
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates as unknown as LatLngExpression[][];
  }
  return [];
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }

  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

export function findSimilarPartnerName(
  candidate: string,
  existingNames: string[],
  threshold = 0.8,
): string | null {
  const normalizedCandidate = normalizeName(candidate);
  if (normalizedCandidate.length < 4) return null;

  for (const name of existingNames) {
    if (!name) continue;
    const normalizedName = normalizeName(name);
    if (levenshteinRatio(normalizedCandidate, normalizedName) >= threshold) {
      return name;
    }
  }

  return null;
}

/**
 * Stringifies a value to JSON, converting any BigInt values to strings to avoid
 * serialization errors.
 */
export function stringifyWithBigInt(value: unknown) {
  return JSON.stringify(value, (_key, jsonValue) =>
    typeof jsonValue === "bigint" ? jsonValue.toString() : jsonValue,
  );
}

/**
 * Calls the app geocoding endpoint so the browser never sees the third-party
 * API key.
 */
export async function fetchCoordsFromAddress(address: string) {
  if (!address.trim()) return null;

  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      data?: { lat: number; lng: number } | null;
    };

    return data.data ?? null;
  } catch (error) {
    console.error("Geocoding request failed:", error);
    return null;
  }
}
