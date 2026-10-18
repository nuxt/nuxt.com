import { z } from 'zod'
import { NUXTERS_CORE_MULTIPLIER, NUXTERS_CORE_REPOS, isNuxtersPeriod, nuxtersPeriodLabel } from '#shared/utils/nuxters'

export default defineMcpTool({
  description: `Lists the Nuxters (contributors to the Nuxt ecosystem) ranked by score for a period, or searches them by username.

WHEN TO USE: Use this tool to rank, compare or find contributors. Common scenarios:
- "Who are the top Nuxt contributors?" - period: "all"
- "Who contributed the most in 2024?" - period: "2024"
- "Who is most active right now?" - period: "30d"
- "How many people contributed to Nuxt last year?" - period: "12m" (see totals)
- "Is there a Nuxter called dan…?" - search: "dan"
- The current page is /nuxters - use its ?period= if present

WHEN NOT TO USE: For the full stats of one known username, use get-nuxter.

PARAMETERS:
- period: "all" (default), "30d", "12m" or a year from 2016 ("2024")
- search: part of a GitHub username; names starting with it come first, then by rank
- limit: 1 to 50 (default 10); offset: for the next pages (not with search)

OUTPUT: Ranked entries (username, rank, score, profile URL), the contributor and contribution totals of the period, and the periods with data. The score weighs merged PRs the most; contributions in ${NUXTERS_CORE_REPOS.join(', ')} count ${NUXTERS_CORE_MULTIPLIER} times. Data is updated every day.`,
  inputSchema: {
    period: z.string().optional().default('all').describe('"all" (default), "30d", "12m", or a year from 2016 such as "2024"'),
    search: z.string().trim().max(39).optional().describe('Part of a GitHub username to search for'),
    limit: z.number().int().min(1).max(50).optional().default(10).describe('Number of entries, 1 to 50 (default 10)'),
    offset: z.number().int().min(0).optional().default(0).describe('Entries to skip, for the next pages (ignored with search)')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { period: 'all' },
    { period: '2024', limit: 20 },
    { search: 'dan' }
  ],
  cache: {
    maxAge: '10m',
    getKey: (args: { period?: string, search?: string, limit?: number, offset?: number }) =>
      `${args.period ?? 'all'}|${args.search?.toLowerCase() ?? ''}|${args.limit ?? 10}|${args.offset ?? 0}`
  },
  async handler({ period = 'all', search, limit = 10, offset = 0 }) {
    if (!isNuxtersPeriod(period)) {
      throw createError({ statusCode: 400, message: `Invalid period "${period}": use all, 30d, 12m or a year from 2016` })
    }

    const page = await nuxters.list({ period, offset: search ? 0 : offset, limit: search ? 1 : limit })
    const items = search
      // GitHub usernames: letters, digits and hyphens
      ? await nuxters.search({ query: search.replace(/[^a-z0-9-]/gi, ''), period, limit })
      : page.items
    const query = period === 'all' ? '' : `?period=${period}`

    return {
      period,
      periodLabel: nuxtersPeriodLabel(period),
      totals: { contributors: page.total, ...page.totals },
      availablePeriods: page.periods,
      updatedAt: page.syncedAt,
      nuxters: items.map(nuxter => ({
        rank: nuxter.rank,
        username: nuxter.username,
        score: nuxter.score,
        url: `https://nuxt.com/nuxters/${nuxter.username}${query}`
      })),
      leaderboardUrl: `https://nuxt.com/nuxters${query}`
    }
  }
})
