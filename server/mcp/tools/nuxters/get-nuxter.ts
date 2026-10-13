import { z } from 'zod'
import { NUXTERS_CORE_MULTIPLIER, NUXTERS_CORE_REPOS, isNuxtersPeriod, nuxterForPeriod, nuxterHackathons, nuxtersPeriodLabel } from '#shared/utils/nuxters'

export default defineMcpTool({
  description: `Retrieves the contributions of one Nuxter (a contributor to the Nuxt ecosystem) by GitHub username: rank, score, merged PRs, issues, comments and reactions, for all time or one period.

WHEN TO USE: Use this tool when the user asks about a specific contributor. Common scenarios:
- "How many PRs did danielroe merge?" - username: "danielroe"
- "What is atinux's rank in 2024?" - username: "atinux", period: "2024"
- "How active was pi0 in the last 30 days?" - username: "pi0", period: "30d"
- The current page is /nuxters/<username> - use that username (and its ?period= if present)

WHEN NOT TO USE: To rank or compare contributors, or to find a username from part of it, use list-nuxters.

PARAMETERS:
- username (required): GitHub username, case-insensitive
- period: "all" (default), "30d", "12m" or a year from 2016 ("2024")

OUTPUT: The stats of the period, its rank and score, the rank and score of every other period the user contributed in, the name, website and social accounts set on GitHub, and the profile URL. Contributions in ${NUXTERS_CORE_REPOS.join(', ')} count ${NUXTERS_CORE_MULTIPLIER} times in the score (merged PRs, helpful issues and helpful comments only).`,
  inputSchema: {
    username: z.string().trim().min(1).max(39).describe('GitHub username, case-insensitive (e.g., "danielroe")'),
    period: z.string().optional().default('all').describe('"all" (default), "30d", "12m", or a year from 2016 such as "2024"')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { username: 'danielroe' },
    { username: 'atinux', period: '2024' }
  ],
  cache: {
    maxAge: '10m',
    getKey: (args: { username: string, period?: string }) => `${args.username.toLowerCase()}|${args.period ?? 'all'}`
  },
  async handler({ username, period = 'all' }) {
    if (!isNuxtersPeriod(period)) {
      throw createError({ statusCode: 400, message: `Invalid period "${period}": use all, 30d, 12m or a year from 2016` })
    }

    const profile = await nuxters.get(username)
    if (!profile) {
      throw createError({ statusCode: 404, message: `No Nuxter found for "${username}". Use list-nuxters with search to find the exact username.` })
    }

    const stats = nuxterForPeriod(profile, period)
    const path = `/nuxters/${profile.username}${period === 'all' ? '' : `?period=${period}`}`

    return {
      username: profile.username,
      period,
      periodLabel: nuxtersPeriodLabel(period),
      // `null` when the user did not contribute in this period
      stats: stats && {
        rank: stats.rank,
        score: stats.score,
        mergedPullRequests: stats.mergedPullRequests,
        issues: stats.issues,
        helpfulIssues: stats.helpfulIssues,
        comments: stats.comments,
        helpfulComments: stats.helpfulComments,
        reactionsReceived: stats.reactions,
        core: stats.core
      },
      firstContributionAt: profile.firstContributionAt,
      hackathons: nuxterHackathons(profile.githubId).map(hackathon => hackathon.name),
      // `null` when the GitHub profile sets none
      links: profile.links,
      periods: [
        { period: 'all', rank: profile.rank, score: profile.score },
        ...profile.periods.map(row => ({ period: row.period, rank: row.rank, score: row.score }))
      ],
      path,
      url: `https://nuxt.com${path}`
    }
  }
})
