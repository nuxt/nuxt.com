export type SponsorType = 'platinum' | 'silver' | 'gold' | 'bronze' | 'backers'

export interface Sponsor {
  sponsorId: string
  sponsorName: string
  sponsorLogo: string
  sponsorUrl: string
  monthlyPriceInDollars: string
  tier: SponsorType
}

function githubHeaders(headers = {}) {
  return {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'nuxt-api',
    'Authorization': `token ${process.env.NUXT_GITHUB_TOKEN}`,
    ...headers
  }
}

function openCollectiveHeaders(headers = {}) {
  return {
    'Api-Key': `${process.env.NUXT_OPEN_COLLECTIVE_API_KEY}`,
    'Content-Type': 'application/json',
    ...headers
  }
}

function toURL(url: string) {
  return url?.startsWith('www.') ? `https://${url}` : url
}

export async function fetchOpenCollectiveSponsors() {
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
              website
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
      console.error(errors)
      /* Stop the loop if any error occurs */
      offset = null
    }

    if (data.collective.members.nodes.length !== 0) {
      offset += data.collective.members.nodes.length
    }
    else {
      offset = null
    }
    const sponsors = (data?.collective?.members?.nodes?.filter(sponsor => sponsor.tier).map((sponsor) => {
      return {
        sponsorId: sponsor.account.slug,
        sponsorName: sponsor.account.name,
        sponsorLogo: sponsor.account.imageUrl,
        sponsorUrl: toURL(sponsor.account.website) || `https://opencollective.com/${sponsor.account.slug}`,
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
    const query: any = `query {
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

    const { data, errors } = await $fetch<{ data: any, errors: any }>('https://api.github.com/graphql', {
      method: 'POST',
      headers: githubHeaders(),
      body: { query }
    })
    const _sponsors = data.organization.sponsorshipsAsMaintainer

    hasNext = _sponsors.pageInfo.hasNextPage
    cursor = _sponsors.pageInfo.endCursor
    if (errors) {
      console.error(errors)
      /* Stop the loop if any error occurs */
      hasNext = false
    }

    const sponsors = (_sponsors?.nodes.map(({ sponsorEntity, tier }: any) => {
      const sponsor = {
        sponsorId: sponsorEntity.login,
        sponsorName: sponsorEntity.name,
        sponsorLogo: sponsorEntity.avatarUrl,
        sponsorUrl: toURL(sponsorEntity.websiteUrl) || `https://github.com/${sponsorEntity.login}`,
        monthlyPriceInDollars: tier.monthlyPriceInDollars
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

      return sponsor
    }) || [])
    response.push(...sponsors)
  } while (hasNext)

  return response
}
