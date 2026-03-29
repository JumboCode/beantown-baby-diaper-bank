const GEOCODIO_API_KEY = process.env.GEOCODIO_API_KEY;

/**
 * Fetches the coordinates of an address using the Geocodio API.
 * @param address The address to geocode.
 * @returns The coordinates of the address.
 */
export async function fetchCoordsFromAddress(address: string) {
  if (!GEOCODIO_API_KEY) {
    console.error("Geocoding API key is not set");
    return null;
  }
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(address)}&api_key=${GEOCODIO_API_KEY}`,
    );
    const data = await response.json();
    return data.results?.[0]?.location as
      | { lat: number; lng: number }
      | null
      | undefined;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}