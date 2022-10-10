import type { Sponsor } from '~/types'

const config = useRuntimeConfig()

const githubHeaders = (headers = {}) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `token ${config.github.token}`,
  ...headers
})

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
    sponsors
  }
}, {
  name: 'github-sponsors',
  maxAge: 60 * 1000
})
