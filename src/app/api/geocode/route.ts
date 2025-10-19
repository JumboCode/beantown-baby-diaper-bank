import { NextResponse } from "next/server";

const GEOCODE_ENDPOINT = "https://us1.locationiq.com/v1/search";
const MIN_INTERVAL_MS = 1000;

let lastRequestTime = 0;
let rateLimitQueue: Promise<void> = Promise.resolve();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function enforceRateLimit() {
  const previous = rateLimitQueue;
  rateLimitQueue = previous.then(async () => {
    const now = Date.now();
    if (lastRequestTime > 0) {
      const elapsed = now - lastRequestTime;
      if (elapsed < MIN_INTERVAL_MS) {
        await sleep(MIN_INTERVAL_MS - elapsed);
      }
    }
    lastRequestTime = Date.now();
  });

  await rateLimitQueue;
}

export async function GET(request: Request) {
  await enforceRateLimit();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEOCODING_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Geocoding API key is not configured." },
      { status: 500 }
    );
  }

  const upstreamParams = new URLSearchParams({
    key: apiKey,
    q: query,
    format: "json",
    limit: "1",
  });

  const upstreamUrl = `${GEOCODE_ENDPOINT}?${upstreamParams.toString()}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      console.error(
        `Geocoding upstream error (${upstreamResponse.status}): ${errorBody}`
      );
      return NextResponse.json(
        { error: "Failed to fetch geocoding results." },
        { status: upstreamResponse.status }
      );
    }

    const results = await upstreamResponse.json();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Unexpected geocoding error:", error);
    return NextResponse.json(
      { error: "Unexpected error resolving geocoding request." },
      { status: 500 }
    );
  }
}
