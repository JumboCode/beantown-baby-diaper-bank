

/**
 * GET /api/distributions
 *
 * Fetches diaper distribution metrics. Optional query params let the caller scope the
 * dataset without downloading the entire table.
 *
 * Query params:
 *   - cityId: number (filters by `city_id`)
 *   - partnerId: number (filters by `partner_id`)
 *   - year: text
 *   - month: text
 */
export async function GET(request: Request) {
  // TODO implement
}
