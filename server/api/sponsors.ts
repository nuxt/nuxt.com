import type { Sponsor } from '~/types'

const config = useRuntimeConfig()

const githubHeaders = (headers = {}) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `token ${config.github.token}`,
  ...headers
})

const tiersMap = {
  platinum: amount => amount >= 2000,
  gold: amount => amount >= 1000 && amount < 2000,
  silver: amount => amount >= 100 && amount < 1000,
  bronze: amount => amount >= 10 && amount < 100,
  backer: amount => amount < 10
}

const fetchSponsors = async (): Promise<Sponsor[]> => {
  const response = []
  const first = 100
  let cursor = null
  let hasNext = false

  do {
    const query = `query {
      organization(login: "nuxt") {
        sponsorshipsAsMaintainer(first: ${first}${cursor ? ` after: "${cursor}"` : ''}) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            createdAt
            privacyLevel
            tier {
              name
              isOneTime
              monthlyPriceInCents
              monthlyPriceInDollars
            }
            sponsorEntity {
              __typename
              ...on Organization {
                login
                name
                avatarUrl
              }
              ...on User {
                login
                name
                avatarUrl
              }
            }
          }
        }
      }
    }`

    const { data, errors } = await $fetch<{ data: any, errors: any }>('https://api.github.com/graphql', {
      method: 'POST',
      headers: githubHeaders(),
      body: { query }
    })

    const sponsors = data.organization.sponsorshipsAsMaintainer

    hasNext = sponsors.pageInfo.hasNextPage
    cursor = sponsors.pageInfo.endCursor
    if (errors) {
      console.error(errors)
      /* Stop the loop if any error occurs */
      hasNext = false
    }
    response.push(...sponsors.nodes)
  } while (hasNext)

  return response
}

export default defineCachedEventHandler(async () => {
  let sponsors = null

  try {
    sponsors = await fetchSponsors()
  } catch (e) {
    console.error(e)
    return
  }

  return {
    sponsors: sponsors.reduce((acc, sponsor) => {
      const { monthlyPriceInDollars } = sponsor.tier
      const tier = Object.keys(tiersMap).find(tier => tiersMap[tier](monthlyPriceInDollars))
      return {
        ...acc,
        [tier]: [...(acc[tier] || []), sponsor]
      }
    }, {})
  }
}, {
  name: 'github-sponsors',
  maxAge: 60 * 1000
})
