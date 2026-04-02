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
