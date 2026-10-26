import type { H3Event } from 'h3'
import { hasProtocol } from 'ufo'
import { kv } from 'hub:kv'
import { githubHeaders } from './github'

const inactiveSponsors = [
  'strapijs',
  'planfredapp'
]

// Listed until `until` (exclusive, UTC), then dropped unless they pay through Open Collective again.
const manualOpenCollectiveSponsors: Array<OpenCollectiveSponsor & { until: string }> = [
  {
    until: '2027-07-01',
    sponsorId: 'icons8',
    sponsorName: 'Icons8',
    sponsorLogo: 'https://images.opencollective.com/icons8/7fa1641/logo/460.png',
    sponsorUrl: 'https://icons8.com/',
    monthlyPriceInDollars: 250,
    tier: 'silver'
  }
]

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

export type OpenCollectiveSponsor = Sponsor

function toDescription(value: string | null | undefined) {
  return value?.trim() || undefined
}

function withManualSponsors(sponsorsById: Map<string, OpenCollectiveSponsor>): OpenCollectiveSponsor[] {
  const now = Date.now()
  for (const { until, ...sponsor } of manualOpenCollectiveSponsors) {
    if (now < Date.parse(until) && !sponsorsById.has(sponsor.sponsorId)) {
      sponsorsById.set(sponsor.sponsorId, sponsor)
    }
  }
  return [...sponsorsById.values()]
}

export async function fetchOpenCollectiveSponsors(): Promise<OpenCollectiveSponsor[]> {
  const key = `sponsors:opencollective-orders`
  const cached = await kv.get<OpenCollectiveSponsor[]>(key)
  if (cached) {
    return cached
  }
  // Members keep their tier after they stop paying and tierless contributions have no tier at all,
  // so current sponsors come from active recurring orders instead.
  // Orders are public, and an API key without the `orders` scope makes this query fail, so no key is sent.
  const sponsorsById = new Map<string, OpenCollectiveSponsor>()
  const first = 100
  let offset = 0
  let hasMore = true
  while (hasMore) {
    const query: string = `query {
      account(slug: "nuxtjs", throwIfMissing: true) {
        orders(filter: INCOMING, status: [ACTIVE], frequency: [MONTHLY, YEARLY], limit: ${first}, offset: ${offset}) {
          nodes {
            createdAt
            frequency
            amount {
              value
            }
            fromAccount {
              name
              slug
              description
              website
              imageUrl(height: 460, format: png)
            }
          }
        }
      }
    }`

    interface OpenCollectiveNode {
      createdAt: string
      frequency: 'MONTHLY' | 'YEARLY'
      amount: {
        value: number
      }
      fromAccount: {
        slug: string
        name: string
        description: string | null
        imageUrl: string
        website: string
      }
    }

    interface OpenCollectiveResponse {
      data: {
        account: {
          orders: {
            nodes: OpenCollectiveNode[]
          }
        }
      }
      errors?: GraphQLError[]
    }

    const { data, errors }: OpenCollectiveResponse = await $fetch<OpenCollectiveResponse>('https://api.opencollective.com/graphql/v2/', {
      method: 'POST',
      body: { query }
    })

    if (errors) {
      console.error('Could not fetch OpenCollective sponsors:', errors)
      return withManualSponsors(new Map())
    }

    const nodes = data?.account?.orders?.nodes || []
    offset += nodes.length
    hasMore = nodes.length === first

    for (const { createdAt, frequency, amount, fromAccount } of nodes) {
      if (inactiveSponsors.includes(fromAccount.slug)) continue

      if (fromAccount.slug === 'logto') {
        fromAccount.website = 'https://logto.io'
      }
      if (fromAccount.slug === 'favbet') {
        fromAccount.website = 'https://www.favbet.ua/uk/casino/'
      }
      if (fromAccount.slug === 'jonathan-3528cbb1') {
        fromAccount.name = 'LOW.MS'
        fromAccount.website = 'https://low.ms'
        fromAccount.imageUrl = 'https://cdn.swiftping.net/static/img/icon.png'
      }

      const monthly = frequency === 'YEARLY' ? Number(amount.value) / 12 : Number(amount.value)
      const existing = sponsorsById.get(fromAccount.slug)
      if (existing) {
        existing.monthlyPriceInDollars += monthly
        existing.tier = getTierByAmount(existing.monthlyPriceInDollars)
        if (!existing.since || createdAt < existing.since) existing.since = createdAt
        continue
      }
      sponsorsById.set(fromAccount.slug, {
        sponsorId: fromAccount.slug,
        sponsorName: fromAccount.name,
        sponsorLogo: fromAccount.imageUrl,
        sponsorUrl: toURL(fromAccount.website) || `https://opencollective.com/${fromAccount.slug}`,
        monthlyPriceInDollars: monthly,
        tier: getTierByAmount(monthly),
        sponsorDescription: toDescription(fromAccount.description),
        since: createdAt
      })
    }
  }

  const response = withManualSponsors(sponsorsById)
  await kv.set(key, response, { ttl: 60 * 60 * 24 }) // cache for 1 day
  return response
}

// Hand-picked, ordered by lifetime contribution: picking by amount pulls in SEO and gambling accounts.
const pastOpenCollectiveSponsors = [
  '2021-frameworks-fund',
  'storyblok',
  'neondatabase',
  'edgio',
  'tipe',
  'legalnature',
  'sanity_io',
  'vueschool_io',
  'localazy',
  'jetbrains',
  'strapijs',
  'zephyr-cloud',
  'finpo',
  'shipshapecode1',
  'planfredapp',
  'wimadev',
  'sendcloud',
  'vuetifyjs',
  'dataforest'
]

export async function fetchPastSponsors(): Promise<PastSponsor[]> {
  const key = `sponsors:past`
  const cached = await kv.get<PastSponsor[]>(key)
  if (cached) {
    return cached
  }

  interface OpenCollectiveAccount {
    slug: string
    name: string
    website: string | null
    imageUrl: string
  }

  const query = `query {
    ${pastOpenCollectiveSponsors.map((slug, index) => `s${index}: account(slug: ${JSON.stringify(slug)}) { slug name website imageUrl(height: 460, format: png) }`).join('\n    ')}
  }`
  const { data, errors } = await $fetch<{ data?: Record<string, OpenCollectiveAccount | null>, errors?: GraphQLError[] }>('https://api.opencollective.com/graphql/v2/', {
    method: 'POST',
    body: { query }
  })
  if (errors) {
    console.error('Could not fetch past Open Collective sponsors:', errors)
  }
  if (!data) {
    return []
  }

  const response = pastOpenCollectiveSponsors
    .map((_, index) => data[`s${index}`])
    .filter((account): account is OpenCollectiveAccount => !!account)
    .map(account => ({
      sponsorId: account.slug,
      sponsorName: account.name,
      sponsorLogo: account.imageUrl,
      sponsorUrl: toURL(account.website || '') || `https://opencollective.com/${account.slug}`
    }))
  await kv.set(key, response, { ttl: 60 * 60 * 24 }) // cache for 1 day
  return response
}

export const fetchGithubSponsors = async (event: H3Event): Promise<Sponsor[]> => {
  if (!useRuntimeConfig(event).github.token) {
    console.warn('[sponsors] Skipping GitHub sponsors: NUXT_GITHUB_TOKEN is not set')
    return []
  }

  const response: Sponsor[] = []
  const first = 100
  let cursor: string | null = null
  let hasNext: boolean

  const key = `sponsors:github-v2`
  const cached = await kv.get<Sponsor[]>(key)
  if (cached) {
    return cached
  }

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
                description
                avatarUrl
                websiteUrl
              }
              ...on User {
                login
                name
                bio
                avatarUrl
                websiteUrl
              }
            }
          }
        }
      }
    }`

    interface GitHubSponsorNode {
      createdAt: string
      sponsorEntity: {
        login: string
        name: string
        description?: string | null
        bio?: string | null
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
    if (errors || !data?.organization?.sponsorshipsAsMaintainer) {
      console.error('Could not fetch GitHub sponsors:', errors)
      return []
    }
    const _sponsors: GitHubSponsorsResponse['data']['organization']['sponsorshipsAsMaintainer'] = data.organization.sponsorshipsAsMaintainer

    hasNext = _sponsors.pageInfo.hasNextPage
    cursor = _sponsors.pageInfo.endCursor
    if (errors) {
      console.error(errors)
      /* Stop the loop if any error occurs */
      hasNext = false
    }

    const sponsors = (_sponsors?.nodes.map(({ createdAt, sponsorEntity, tier }) => {
      const amount = Number(tier?.monthlyPriceInDollars) || 0
      const sponsor: Sponsor = {
        sponsorId: sponsorEntity.login,
        sponsorName: sponsorEntity.name,
        sponsorLogo: sponsorEntity.avatarUrl,
        sponsorUrl: toURL(sponsorEntity.websiteUrl) || `https://github.com/${sponsorEntity.login}`,
        monthlyPriceInDollars: amount,
        tier: getTierByAmount(amount),
        sponsorDescription: toDescription(sponsorEntity.description ?? sponsorEntity.bio),
        since: createdAt
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
    tier: 'diamond',
    sponsorDescription: 'Agentic infrastructure for every app and agent.'
  })
  await kv.set(key, response, { ttl: 60 * 60 * 24 }) // cache for 1 day
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
