import type { Sponsor, SponsorType } from '#shared/types'

export default cachedEventHandler(async (event) => {
  const results = await Promise.allSettled([
    fetchGithubSponsors(event),
    fetchOpenCollectiveSponsors()
  ])
  const sponsors: Sponsor[][] = results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    console.warn(`[sponsors] Failed to load ${index === 0 ? 'GitHub' : 'Open Collective'} sponsors:`, result.reason)
    return []
  })

  const sponsorsByTier: Record<SponsorType, Array<Sponsor>> = {
    diamond: [],
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
    backers: []
  }

  for (const chunk of sponsors) {
    for (const sponsor of chunk) {
      if (isBlockedSponsor(sponsor)) continue

      const tier = getTierByAmount(sponsor.monthlyPriceInDollars)

      sponsorsByTier[tier] ||= []
      sponsorsByTier[tier].push(sponsor)
    }
  }

  return sponsorsByTier
}, {
  name: 'sponsors',
  getKey: () => 'sponsors',
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
