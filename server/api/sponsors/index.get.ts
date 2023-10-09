type Tier = (amount: number) => Boolean

const tiersMap: {[tier: string] : Tier} = {
  platinum: amount => amount >= 1000,
  gold: amount => amount < 1000 && amount >= 500,
  silver: amount => amount < 500 && amount >= 200,
  bronze: amount => amount < 200 && amount >= 100,
  backer: amount => amount < 100
}

export default cachedEventHandler(async () => {
  const sponsors = await Promise.all([
    fetchGithubSponsors(),
    fetchOpenCollectiveSponsors()
  ])

  return sponsors.flat().reduce((acc, sponsor) => {
    const tier = Object.keys(tiersMap).find(tier => tiersMap[tier](sponsor.monthlyPriceInDollars)) as string
    return {
      ...acc,
      [tier]: [...(acc[tier] || []), sponsor]
    }
  }, {
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
