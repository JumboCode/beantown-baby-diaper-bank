import type { BasicPartnerSite } from "@/data/mapContent";
import { PartnerSite } from "./types";

const geocodeCache = new Map<string, Promise<PartnerSite>>();

export async function resolvePartnerAddress(
  basicPartnerSite: BasicPartnerSite
): Promise<PartnerSite> {
  const { address, regionId } = basicPartnerSite;
  const key = `${address}|${regionId}`;

  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    // look up lat long of address if needed
    const response = await fetch(
      `/api/geocode?q=${encodeURIComponent(address)}`
    );
    console.log("GEOCODING RESPONSE", response);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      const message =
        typeof errorBody?.error === "string"
          ? errorBody.error
          : `Could not resolve geocode request (status ${response.status}).`;
      throw new Error(message);
    }

    const results: unknown = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      const { lat, lon } = results[0] as { lat: string; lon: string };
      return {
        ...basicPartnerSite,
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        },
        regionId,
      };
    }

    if (
      results &&
      typeof results === "object" &&
      "error" in results &&
      typeof (results as { error?: unknown }).error === "string"
    ) {
      throw new Error((results as { error: string }).error);
    }

    throw new Error(`Could not geocode address: ${address}`);
  })();

  // On error, remove from cache so future calls can retry.
  geocodeCache.set(key, promise);
  return promise.catch((err) => {
    geocodeCache.delete(key);
    throw err;
  });
}
