type Tier = (amount: number) => boolean

const tiersMap: { [tier: string]: Tier } = {
  diamond: amount => amount >= 2500,
  platinum: amount => amount >= 1000 && amount < 2500,
  gold: amount => amount < 1000 && amount >= 500,
  silver: amount => amount < 500 && amount >= 250,
  bronze: amount => amount <= 200 && amount >= 100,
  backer: amount => amount < 100
}

export default cachedEventHandler(async (event) => {
  const sponsors = await Promise.all([
    fetchGithubSponsors(event),
    fetchOpenCollectiveSponsors(event)
  ])

  return sponsors.flat().reduce((acc, sponsor) => {
    const tier = Object.keys(tiersMap).find(tier => tiersMap[tier](sponsor.monthlyPriceInDollars)) as string
    return {
      ...acc,
      [tier]: [...(acc[tier] || []), sponsor]
    }
  }, {
    diamond: [],
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
    backer: []
  })
}, {
  name: 'sponsors',
  getKey: () => 'sponsors',
  maxAge: 60 * 60 // 1 hour
})
