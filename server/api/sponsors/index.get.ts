import type { Sponsor, SponsorType } from '#shared/types'

export default cachedEventHandler(async (event) => {
  const sponsors = await Promise.all([
    fetchGithubSponsors(event),
    fetchOpenCollectiveSponsors(event)
  ])

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
      const tier = getTierByAmount(sponsor.monthlyPriceInDollars)

      sponsorsByTier[tier] ||= []
      sponsorsByTier[tier].push(sponsor)
    }
  }

  return sponsorsByTier
}, {
  name: 'sponsors',
  getKey: () => 'sponsors',
  maxAge: 60 * 60 // 1 hour
})
