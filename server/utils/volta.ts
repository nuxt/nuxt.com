import type { H3Event } from 'h3'

export interface VoltaContributor {
  username: string
  issues: number
  merged_pull_requests: number
  helpful_issues: number
  comments: number
  helpful_comments: number
  reactions: number
}

export const fetchOrgsContributors = async (_event: H3Event, orgs: string[]) => {
  if (!process.env.NUXT_VOLTA_TOKEN) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_VOLTA_TOKEN in env variables'
    })
  }
  logger.info(`Fetching ${orgs} contributors on Volta...`)
  const orgsQquery = orgs.map(org => `owner=${org}`).join('&')
  return await $fetch<VoltaContributor[]>(`http://api.volta.net/users/stats?${orgsQquery}&token=${process.env.NUXT_VOLTA_TOKEN}`)
    .then(contributors => contributors.filter((contributor: any) => !isBot(contributor.username)))
})

