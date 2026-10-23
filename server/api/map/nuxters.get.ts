import { z } from 'zod'
import { isNuxtersPeriod } from '#shared/utils/nuxters'

/**
 * The Nuxters of a period by country: `?period=12m`.
 * Not under /api/nuxters/: a GitHub user named "map" would lose their profile API.
 */
export default defineEventHandler(async (event) => {
  const { period } = await getValidatedQuery(event, z.object({
    period: z.string().refine(isNuxtersPeriod, 'Expected all, 30d, 12m or a year from 2016').default('all')
  }).parse)

  setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  return nuxters.map(period)
})
