
/**
 * GET /api/cities
 *
 * Returns every city row (optionally filtered by name) so the frontend has a single,
 * well-documented place to pull geographic context.
 *
 * Query params:
 *   - search: partial, case-insensitive match against the city name.
 *   - year: filters related distributions by the supplied year.
 *   - month: filters related distributions by the supplied month.
 *
 * We keep the handler dead simple: query through Prisma, include per-city distribution
 * records, and ship the results back to the caller. Whenever you add another table,
 * feel free to clone this file as your starter template.
 */
export const dynamic = "force-dynamic"; // ensure Next.js never caches DB reads.

export async function GET(request: Request) {
  // TODO: implement
}
