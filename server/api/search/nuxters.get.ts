import { z } from 'zod'
import { isNuxtersPeriod } from '#shared/utils/nuxters'

/**
 * Search Nuxters by username: `?q=dan&period=2024`.
 * Not under /api/nuxters/: a GitHub user named "search" would lose their profile API.
 */
export default defineEventHandler(async (event) => {
  const { q, period, limit } = await getValidatedQuery(event, z.object({
    // GitHub usernames: letters, digits and hyphens, 39 characters at most
    q: z.string().trim().max(39).transform(value => value.replace(/[^a-z0-9-]/gi, '')),
    period: z.string().refine(isNuxtersPeriod, 'Expected all, 30d, 12m or a year from 2016').default('all'),
    limit: z.coerce.number().int().min(1).max(20).default(8)
  }).parse)

  setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  return nuxters.search({ query: q, period, limit })
})
