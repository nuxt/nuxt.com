import type { VoltaContributor } from '~/server/utils/volta'

const BOTS = ['codecov-io', 'codecov-commenter']

export default cachedEventHandler(async (event) => {
  if (!process.env.NUXT_VOLTA_TOKEN) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_VOLTA_TOKEN in env variables'
    })
  }

  console.log('Fetching /contributors...')

  let contributors = await fetchOrgsContributors(event, ['nuxt', 'nuxt-modules', 'nuxt-themes', 'nuxt-ui-pro', 'unjs', 'nuxtlabs', 'nuxt-hub']) as Array<VoltaContributor & { score: number }>

  // Remove bots
  contributors = contributors.filter(({ username }) => !BOTS.includes(username))

  // Limit to 1000 contributors
  // contributors = contributors.slice(0, 1000)

  // Calculate score for each contributor
  for (const contributor of contributors) {
    contributor.score = Math.round(
      contributor.issues * 1
      + contributor.comments * 0.5
      + contributor.merged_pull_requests * 5
      + contributor.helpful_issues * 3
      + contributor.helpful_comments * 2
      + contributor.reactions * 0.1
    )
  }
  // Sort by score
  contributors.sort((a, b) => b.score - a.score)
  // Merge contributors with the same username but different lowercase/uppercase
  contributors = mergeContributors(contributors)

  return contributors
}, {
  name: 'contributors',
  swr: true,
  maxAge: 60 * 5 // 5 minutes
})

function mergeContributors(contributors: Array<VoltaContributor & { score: number }>) {
  const mergedMap = new Map()

  for (const contributor of contributors) {
    const lowercaseUsername = contributor.username.toLowerCase()

    if (mergedMap.has(lowercaseUsername)) {
      const existingContributor = mergedMap.get(lowercaseUsername)

      // Sum up all numeric properties
      for (const [key, value] of Object.entries(contributor)) {
        if (typeof value === 'number') {
          existingContributor[key] = (existingContributor[key] || 0) + value
        }
      }
    }
    else {
      mergedMap.set(lowercaseUsername, contributor)
    }
  }

  return Array.from(mergedMap.values())
};
