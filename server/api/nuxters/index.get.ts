import { z } from 'zod'
import { isNuxtersPeriod } from '#shared/utils/nuxters'

/** A leaderboard, by rank: `?period=all` (default), `30d`, `12m` or a year (`2025`). */
export default defineEventHandler(async (event) => {
  const { period, offset, limit } = await getValidatedQuery(event, z.object({
    period: z.string().refine(isNuxtersPeriod, 'Expected all, 30d, 12m or a year from 2016').default('all'),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(250).default(100)
  }).parse)

  // Data changes once a day: let the CDN absorb the "Show more" traffic.
  setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  return nuxters.list({ period, offset, limit })
})
