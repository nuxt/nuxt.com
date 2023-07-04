export interface VoltaContributor {
  username: string
  issues: number
  merged_pull_requests: number
  helpful_issues: number
  comments: number
  helpful_comments: number
  reactions: number
}

export const fetchOrgsContributors = cachedFunction<VoltaContributor[]>(async (orgs: string[]) => {
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
}, {
  name: 'volta-orgs-contributors',
  maxAge: 60 * 60, // 1 hour
  getKey: (orgs: string[]) => orgs.join('-')
})