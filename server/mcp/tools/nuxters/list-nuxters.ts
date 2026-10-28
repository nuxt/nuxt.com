import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { NUXTERS_CORE_MULTIPLIER, NUXTERS_CORE_REPOS, isNuxtersPeriod, nuxterCountryCode, nuxtersPeriodLabel } from '#shared/utils/nuxters'
import { countryName } from '#shared/utils/nuxters-countries'

const inputSchema = z.object({
  period: z.string().optional().default('all').describe('"all" (default), "30d", "12m", or a year from 2016 such as "2024"'),
  country: z.string().trim().optional().describe('ISO 3166-1 alpha-2 country code such as "FR": only the Nuxters from that country'),
  search: z.string().trim().max(39).optional().describe('Part of a GitHub username to search for'),
  limit: z.number().int().min(1).max(50).optional().default(10).describe('Number of entries, 1 to 50 (default 10)'),
  offset: z.number().int().min(0).optional().default(0).describe('Entries to skip, for the next pages (ignored with search)')
})

const getResult = defineCachedFunction(async (event: H3Event, { period = 'all', country: requestedCountry, search, limit = 10, offset = 0 }: z.output<typeof inputSchema>) => {
  if (!isNuxtersPeriod(period)) {
    throw createError({ statusCode: 400, message: `Invalid period "${period}": use all, 30d, 12m or a year from 2016` })
  }
  const country = requestedCountry === undefined ? null : nuxterCountryCode(requestedCountry)
  if (requestedCountry !== undefined && !country) {
    throw createError({ statusCode: 400, message: `Invalid country "${requestedCountry}": use an ISO 3166-1 alpha-2 code such as FR` })
  }

  const page = await nuxters.list({ period, country, offset: search ? 0 : offset, limit: search ? 1 : limit })
  const items = search
  // GitHub usernames: letters, digits and hyphens
    ? await nuxters.search({ query: search.replace(/[^a-z0-9-]/gi, ''), period, country, limit })
    : page.items
  const query = period === 'all' ? '' : `?period=${period}`
  // `/nuxters` alone shows the default period, not all time.
  const leaderboardQuery = new URLSearchParams({ period, ...(country ? { country } : {}) }).toString()

  return {
    period,
    periodLabel: nuxtersPeriodLabel(period),
    country: country && { code: country, name: countryName(country) },
    totals: { contributors: page.total, ...page.totals },
    availablePeriods: page.periods,
    updatedAt: page.syncedAt,
    nuxters: items.map(nuxter => ({
      rank: nuxter.rank,
      username: nuxter.username,
      score: nuxter.score,
      url: `https://nuxt.com/nuxters/${nuxter.username}${query}`
    })),
    leaderboardUrl: `https://nuxt.com/nuxters?${leaderboardQuery}`
  }
}, {
  name: 'mcp-list-nuxters',
  maxAge: 600,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args.period, args.country?.toUpperCase(), args.search?.toLowerCase(), args.limit, args.offset])
})

export default defineMcpTool({
  description: `Lists the Nuxters (contributors to the Nuxt ecosystem) ranked by score for a period, or searches them by username.

WHEN TO USE: Use this tool to rank, compare or find contributors. Common scenarios:
- "Who are the top Nuxt contributors?" - period: "all"
- "Who contributed the most in 2024?" - period: "2024"
- "Who is most active right now?" - period: "30d"
- "How many people contributed to Nuxt last year?" - period: "12m" (see totals)
- "Who are the top Nuxters in France?" - country: "FR"
- "Is there a Nuxter called dan…?" - search: "dan"
- The current page is /nuxters - use its ?period= and ?country= if present

WHEN NOT TO USE: For the full stats of one known username, use get-nuxter.

PARAMETERS:
- period: "all" (default), "30d", "12m" or a year from 2016 ("2024")
- country: ISO 3166-1 alpha-2 code ("FR", "US"), from the location on GitHub profiles; ranks stay global
- search: part of a GitHub username; names starting with it come first, then by rank
- limit: 1 to 50 (default 10); offset: for the next pages (not with search)

OUTPUT: Ranked entries (username, rank, score, profile URL), the contributor and contribution totals of the period (and country), and the periods with data. The score weighs merged PRs the most; contributions in ${NUXTERS_CORE_REPOS.join(', ')} count ${NUXTERS_CORE_MULTIPLIER} times. Data is updated every day.`,
  inputSchema: inputSchema.meta({ examples: [
    { period: 'all' },
    { period: '2024', limit: 20 },
    { country: 'FR' },
    { search: 'dan' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
