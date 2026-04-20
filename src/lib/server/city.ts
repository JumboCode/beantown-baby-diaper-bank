const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

const SUPPORTED_ADDRESS_TYPES = new Set(["city", "administrative", "town", "suburb", "village"]);

export async function fetchCityGeoDataFromNominatim(cityName: string) {
  const query = new URLSearchParams({
    state: "Massachusetts",
    city: cityName,
    country: "United States",
    format: "jsonv2",
    polygon_geojson: "1",
    limit: "1",
    countrycodes: "us",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${query.toString()}`, {
    headers: {
      "User-Agent": `beantown-baby-diaper-bank/1.0 (contact: ${process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL})`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Please check the entered cities.", { cause: response.status });
  }

  const result = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    geojson?: unknown;
    addresstype?: string;
  }>;

  const first = result[0];
  if (!first) {
    throw new Error(`"${cityName}" is not a city in Massachusetts`, { cause: 404 });
  }

  const lat = first.lat ? Number(first.lat) : NaN;
  const lon = first.lon ? Number(first.lon) : NaN;
  const addressType = typeof first.addresstype === "string" ? first.addresstype : "";

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error(`Invalid coordinates for city: ${cityName}`, { cause: 422 });
  }

  if (!first.geojson || typeof first.geojson !== "object") {
    throw new Error(`Invalid geojson for city: ${cityName}`, { cause: 422 });
  }
  if (!SUPPORTED_ADDRESS_TYPES.has(addressType)) {
    console.warn(`Unsupported address type "${addressType}" for city: ${cityName}`);
    throw new Error(`Could not find region: ${cityName}`, { cause: 422 });
  }

  return {
    centroidGeoJson: JSON.stringify({
      type: "Point",
      coordinates: [lon, lat],
    }),
    addressType,
    boundaryGeoJson: JSON.stringify(first.geojson),
  };
}
