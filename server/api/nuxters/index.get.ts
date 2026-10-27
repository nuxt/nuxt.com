import { z } from 'zod'
import { isNuxtersPeriod, nuxterCountryCode } from '#shared/utils/nuxters'

/** A leaderboard, by rank: `?period=all` (default), `30d`, `12m` or a year (`2025`), and `?country=FR` for one country. */
export default defineEventHandler(async (event) => {
  const { period, country, offset, limit } = await getValidatedQuery(event, z.object({
    period: z.string().refine(isNuxtersPeriod, 'Expected all, 30d, 12m or a year from 2016').default('all'),
    country: z.string().optional().refine(value => value === undefined || nuxterCountryCode(value) !== null, 'Expected an ISO 3166-1 alpha-2 country code').transform(nuxterCountryCode),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(250).default(100)
  }).parse)

  // Data changes once a day: let the CDN absorb the "Show more" traffic.
  setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  return nuxters.list({ period, country, offset, limit })
})
