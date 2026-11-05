import { z } from 'zod'
import { isNuxtersPeriod, nuxterForPeriod, nuxterHackathons, nuxtersPeriodPhrase } from '#shared/utils/nuxters'

/** Called by Nuxi's `show_nuxter` tool: what the Nuxter card of the chat shows. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { username, period } = await readValidatedBody(event, z.object({
    username: z.string().trim().regex(/^[a-z0-9-]{1,39}$/i),
    period: z.string().optional().default('all')
  }).parse)

  if (!isNuxtersPeriod(period)) {
    return { error: `Invalid period "${period}": use all, 30d, 12m or a year from 2016` }
  }
  const profile = await nuxters.get(username)
  if (!profile) {
    return { error: `No Nuxter found for "${username}"` }
  }

  // A period the user did not contribute in shows all time instead.
  const shown = nuxterForPeriod(profile, period) ? period : 'all'
  const stats = nuxterForPeriod(profile, shown)!
  const modules = await nuxterModules(event, profile)

  return {
    username: profile.username,
    name: profile.links?.name ?? null,
    period: shown,
    periodPhrase: shown === 'all' ? null : nuxtersPeriodPhrase(shown),
    rank: stats.rank,
    score: stats.score,
    mergedPullRequests: stats.mergedPullRequests.all,
    issues: stats.issues,
    comments: stats.comments,
    reactions: stats.reactions,
    maintainedModules: modules.maintained.length,
    contributedModules: modules.contributed.length,
    hackathons: nuxterHackathons(profile.githubId).map(hackathon => hackathon.name),
    path: `/nuxters/${profile.username}${shown === 'all' ? '' : `?period=${shown}`}`
  }
})
