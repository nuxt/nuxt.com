import { z } from 'zod'
import { NUXTERS_CORE_MULTIPLIER, NUXTERS_CORE_REPOS, isNuxtersPeriod, nuxterForPeriod, nuxterHackathons, nuxtersPeriodLabel } from '#shared/utils/nuxters'
import { countryName } from '#shared/utils/nuxters-countries'

export default defineMcpTool({
  description: `Retrieves the contributions of one Nuxter (a contributor to the Nuxt ecosystem) by GitHub username: rank, score, merged PRs, issues, comments and reactions, for all time or one period.

WHEN TO USE: Use this tool when the user asks about a specific contributor. Common scenarios:
- "How many PRs did danielroe merge?" - username: "danielroe"
- "What is atinux's rank in 2024?" - username: "atinux", period: "2024"
- "How active was pi0 in the last 30 days?" - username: "pi0", period: "30d"
- "Where is danielroe from?" - username: "danielroe" (see country)
- The current page is /nuxters/<username> - use that username (and its ?period= if present)

WHEN NOT TO USE: To rank or compare contributors, or to find a username from part of it, use list-nuxters.

PARAMETERS:
- username (required): GitHub username, case-insensitive
- period: "all" (default), "30d", "12m" or a year from 2016 ("2024")

OUTPUT: The stats of the period, its rank and score, the rank and score of every other period the user contributed in, the name, website and social accounts set on GitHub, the country of the GitHub location, the modules of the official list (Nuxt 3+) the user maintains or contributed to (by downloads), the posts they wrote on the Nuxt blog, and the profile URL. Contributions in ${NUXTERS_CORE_REPOS.join(', ')} count ${NUXTERS_CORE_MULTIPLIER} times in the score (merged PRs, helpful issues and helpful comments only).`,
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
    const [modules, blogPosts] = await Promise.all([nuxterModules(useEvent(), profile), nuxterBlogPosts(profile.username)])
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
      // ISO 3166-1 alpha-2, from the GitHub location; `null` when not set or not recognized
      country: profile.country && { code: profile.country, name: countryName(profile.country) },
      // Module slugs: /modules/<name>, or show_module in Nuxi
      modules: {
        maintained: modules.maintained.map(module => ({ name: module.name, npm: module.npm, downloads: module.stats?.downloads ?? 0 })),
        contributed: modules.contributed.map(module => module.name)
      },
      // Newest first: /blog/... paths, for get-blog-post or show_blog_post
      blogPosts: blogPosts.map(post => ({ title: post.title, path: post.path, date: post.date })),
      periods: [
        { period: 'all', rank: profile.rank, score: profile.score },
        ...profile.periods.map(row => ({ period: row.period, rank: row.rank, score: row.score }))
      ],
      path,
      url: `https://nuxt.com${path}`
    }
  }
})
