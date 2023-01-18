import type { Sponsor } from '../../types'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

const githubHeaders = (headers = {}) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `token ${config.githubAPI.token}`,
  ...headers
})

const openCollectiveHeaders = (headers = {}) => ({
  'Api-Key': `${config.openCollective.apiKey}`,
  'Content-Type': 'application/json',
  ...headers
})

export const fetchOpenCollectiveSponsors = async (): Promise<any[]> => {
  const response = []
  const first = 100
  let offset = null
  do {
    const query = `query {
      collective(slug: "nuxtjs", throwIfMissing: true) {
        members(limit: ${first}${offset ? ` offset: ${offset}` : ''} role: [BACKER]) {
          offset
          limit
          totalCount
          nodes {
            id
            role
            createdAt
            since
            totalDonations {
              value
              currency
              valueInCents
            }
            tier {
              name
              type
              amount {
                value
              }
              endsAt
            }
            account {
              name
              slug
              type
              isIncognito
              imageUrl(height: 460, format: png)
            }
          }
        }
      }
    }`

    const { data, errors } = await $fetch<{ data: any, errors: any }>('https://api.opencollective.com/graphql/v2/', {
      method: 'POST',
      headers: openCollectiveHeaders(),
      body: { query }
    })

    if (errors) {
      // eslint-disable-next-line no-console
      console.error(errors)
      /* Stop the loop if any error occurs */
      offset = null
    }

    if (data.collective.members.nodes.length !== 0) {
      offset += data.collective.members.nodes.length
    } else {
      offset = null
    }

    const sponsors = (data?.collective?.members?.nodes?.filter(sponsor => sponsor.tier).map((sponsor) => {
      return {
        sponsorId: sponsor.account.slug,
        sponsorName: sponsor.account.name,
        sponsorLogo: sponsor.account.imageUrl,
        sponsorUrl: `https://opencollective.com/${sponsor.account.slug}`,
        monthlyPriceInDollars: sponsor.tier.amount.value
      }
    }) || [])
    response.push(...sponsors)
  } while (offset)

  return response
}

export const fetchGithubSponsors = async (): Promise<Sponsor[]> => {
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

    const _sponsors = data.organization.sponsorshipsAsMaintainer

    hasNext = _sponsors.pageInfo.hasNextPage
    cursor = _sponsors.pageInfo.endCursor
    if (errors) {
      // eslint-disable-next-line no-console
      console.error(errors)
      /* Stop the loop if any error occurs */
      hasNext = false
    }

    const sponsors = (_sponsors?.nodes.map(({ sponsorEntity, tier }) => {
      return {
        sponsorId: sponsorEntity.login,
        sponsorName: sponsorEntity.name,
        sponsorLogo: sponsorEntity.avatarUrl,
        sponsorUrl: `https://github.com/${sponsorEntity.login}`,
        monthlyPriceInDollars: tier.monthlyPriceInDollars
      }
    }) || [])
    response.push(...sponsors)
  } while (hasNext)

  return response
}
