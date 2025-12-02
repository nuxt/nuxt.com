import type { H3Event } from 'h3'
import { hasProtocol } from 'ufo'

const inactiveSponsors = [
  'strapijs',
  'planfredapp'
]

function githubHeaders(event: H3Event, headers: Record<string, string> = {}) {
  return {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'nuxt-api',
    'Authorization': `token ${useRuntimeConfig(event).github.token}`,
    ...headers
  }
}

function openCollectiveHeaders(event: H3Event, headers: Record<string, string> = {}) {
  return {
    'Api-Key': `${useRuntimeConfig(event).openCollective.apiKey}`,
    'Content-Type': 'application/json',
    ...headers
  }
}

function toURL(url: string) {
  return !url || hasProtocol(url) ? url : `https://${url}`
}

export function getTierByAmount(amount: number): SponsorType {
  if (amount >= 2500) return 'diamond'
  if (amount >= 1000) return 'platinum'
  if (amount >= 500) return 'gold'
  if (amount >= 250) return 'silver'
  if (amount >= 100) return 'bronze'
  return 'backers'
}

export interface OpenCollectiveSponsor {
  sponsorId: string
  sponsorName: string
  sponsorLogo: string
  sponsorUrl: string
  monthlyPriceInDollars: number
  tier: SponsorType
}

export async function fetchOpenCollectiveSponsors(event: H3Event): Promise<OpenCollectiveSponsor[]> {
  const response: OpenCollectiveSponsor[] = []
  const first = 100
  let offset: number | null = null
  do {
    const query: string = `query {
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
              website
              isIncognito
              imageUrl(height: 460, format: png)
            }
          }
        }
      }
    }`

    interface OpenCollectiveNode {
      account: {
        slug: string
        name: string
        imageUrl: string
        website: string
      }
      tier: {
        amount: {
          value: string
        }
      }
    }

    interface OpenCollectiveResponse {
      data: {
        collective: {
          members: {
            nodes: OpenCollectiveNode[]
          }
        }
      }
      errors?: GraphQLError[]
    }

    const { data, errors }: OpenCollectiveResponse = await $fetch<OpenCollectiveResponse>('https://api.opencollective.com/graphql/v2/', {
      method: 'POST',
      headers: openCollectiveHeaders(event),
      body: { query }
    })

    if (errors) {
      console.error(errors)
      /* Stop the loop if any error occurs */
      offset = null
    }

    if (data.collective.members.nodes.length !== 0) {
      offset = (offset ?? 0) + data.collective.members.nodes.length
    } else {
      offset = null
    }
    const sponsors = (data?.collective?.members?.nodes?.filter(sponsor => sponsor.tier).map((sponsor: OpenCollectiveNode): OpenCollectiveSponsor => {
      if (sponsor.account.slug === 'logto') {
        sponsor.account.website = 'https://logto.io'
      }
      if (sponsor.account.slug === 'favbet') {
        sponsor.account.website = 'https://www.favbet.ua/uk/casino/'
      }
      return {
        sponsorId: sponsor.account.slug,
        sponsorName: sponsor.account.name,
        sponsorLogo: sponsor.account.imageUrl,
        sponsorUrl: toURL(sponsor.account.website) || `https://opencollective.com/${sponsor.account.slug}`,
        monthlyPriceInDollars: Number(sponsor.tier.amount.value),
        tier: getTierByAmount(Number(sponsor.tier.amount.value))
      }
    }) || [])
    response.push(...sponsors.filter(sponsor => !inactiveSponsors.includes(sponsor.sponsorId)))
  } while (offset)

  return response
}

export const fetchGithubSponsors = async (event: H3Event): Promise<Sponsor[]> => {
  const response: Sponsor[] = []
  const first = 100
  let cursor: string | null = null
  let hasNext = false

  do {
    const query = `query {
      organization(login: "nuxt") {
        sponsorshipsAsMaintainer(includePrivate: false, first: ${first}${cursor ? ` after: "${cursor}"` : ''}) {
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
                websiteUrl
              }
              ...on User {
                login
                name
                avatarUrl
                websiteUrl
              }
            }
          }
        }
      }
    }`

    interface GitHubSponsorNode {
      sponsorEntity: {
        login: string
        name: string
        avatarUrl: string
        websiteUrl: string
      }
      tier: {
        monthlyPriceInDollars: string
      }
    }

    interface GitHubSponsorsResponse {
      data: {
        organization: {
          sponsorshipsAsMaintainer: {
            pageInfo: {
              endCursor: string
              hasNextPage: boolean
            }
            nodes: GitHubSponsorNode[]
          }
        }
      }
      errors?: GraphQLError[]
    }

    const { data, errors }: GitHubSponsorsResponse = await $fetch<GitHubSponsorsResponse>('https://api.github.com/graphql', {
      method: 'POST',
      headers: githubHeaders(event),
      body: { query }
    })
    const _sponsors: GitHubSponsorsResponse['data']['organization']['sponsorshipsAsMaintainer'] = data.organization.sponsorshipsAsMaintainer

    hasNext = _sponsors.pageInfo.hasNextPage
    cursor = _sponsors.pageInfo.endCursor
    if (errors) {
      console.error(errors)
      /* Stop the loop if any error occurs */
      hasNext = false
    }

    const sponsors = (_sponsors?.nodes.map(({ sponsorEntity, tier }) => {
      const sponsor: Sponsor = {
        sponsorId: sponsorEntity.login,
        sponsorName: sponsorEntity.name,
        sponsorLogo: sponsorEntity.avatarUrl,
        sponsorUrl: toURL(sponsorEntity.websiteUrl) || `https://github.com/${sponsorEntity.login}`,
        monthlyPriceInDollars: Number(tier.monthlyPriceInDollars),
        tier: getTierByAmount(Number(tier.monthlyPriceInDollars))
      }

      // Hack for nickolasmartin
      if (sponsor.sponsorId === 'nickolasmartin') {
        sponsor.sponsorName = 'Direqt'
        sponsor.sponsorLogo = 'https://avatars.githubusercontent.com/u/32824382?v=4'
        sponsor.sponsorUrl = 'https://www.direqt.ai'
      }
      if (sponsor.sponsorId === 'martaklimowiczgh') {
        sponsor.sponsorName = 'Monterail'
        sponsor.sponsorLogo = 'https://avatars.githubusercontent.com/u/234138?&v=4'
        sponsor.sponsorUrl = 'https://www.monterail.com/'
      }
      if (sponsor.sponsorId === 'DCM-LVT') {
        sponsor.sponsorName = 'Dotcom Monitor'
        sponsor.sponsorUrl = 'https://www.dotcom-monitor.com/sponsoring-open-source-projects/'
      }
      if (sponsor.sponsorId === 'netlify-bot') {
        sponsor.sponsorName = 'Netlify'
      }
      if (sponsor.sponsorId === 'zenarchitects') {
        sponsor.sponsorName = 'Zen Architects'
      }

      return sponsor
    }) || [])
    response.push(...sponsors.filter(sponsor => !inactiveSponsors.includes(sponsor.sponsorId)))
  } while (hasNext)

  response.unshift({
    sponsorId: 'vercel',
    sponsorName: 'Vercel',
    sponsorLogo: 'https://avatars.githubusercontent.com/u/14985020',
    sponsorUrl: 'https://vercel.com',
    monthlyPriceInDollars: 10000,
    tier: 'diamond'
  })
  return response
}

interface GraphQLError {
  message: string
  locations?: Array<{
    line: number
    column: number
  }>
  path?: Array<string | number>
  extensions?: {
    code?: string
    [key: string]: unknown
  }
}
