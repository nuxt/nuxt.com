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

export const fetchOrgsContributors = async (event: H3Event, orgs: string[]) => {
  const token = useRuntimeConfig(event).volta.token
  if (!token) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_VOLTA_TOKEN in env variables'
    })
  }
  console.info(`Fetching ${orgs} contributors on Volta...`)
  const orgsQquery = orgs.map(org => `owner=${org}`).join('&')
  return await $fetch<VoltaContributor[]>(`http://api.volta.net/users/stats?${orgsQquery}&token=${token}`)
    .then(contributors => contributors.filter(contributor => !isBot(contributor.username)))
}
