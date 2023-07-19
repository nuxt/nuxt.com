import type { VoltaContributor } from "~/server/utils/volta"

export default cachedEventHandler(async (event) => {
  if (!process.env.NUXT_VOLTA_TOKEN) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_VOLTA_TOKEN in env variables'
    })
  }

  console.log('Fetching new /contributors')

  let contributors = await fetchOrgsContributors(event, ['nuxt', 'nuxt-modules']) as Array<VoltaContributor & { score: number }>

  // Limit to 1000 contributors
  // contributors = contributors.slice(0, 1000)

  // Calculate score for each contributor
  for (const contributor of contributors) {
    contributor.score = Math.round(
      contributor.issues * 1 +
      contributor.comments * 0.5 +
      contributor.merged_pull_requests * 5 +
      contributor.helpful_issues * 3 +
      contributor.helpful_comments * 2 +
      contributor.reactions * 0.1
    )
  }
  // Sort by score
  contributors.sort((a, b) => b.score - a.score)

  return contributors
}, {
  name: 'contributors',
  swr: true,
  maxAge: 30,
})
