import { fetchGithubSponsors } from '~/server/utils/sponsors'

const tiersMap = {
  platinum: amount => amount >= 2000,
  gold: amount => amount >= 1000 && amount < 2000,
  silver: amount => amount >= 100 && amount < 1000,
  bronze: amount => amount >= 10 && amount < 100,
  backer: amount => amount < 10
}

export default defineCachedEventHandler(async () => {
  let sponsors = null

  try {
    sponsors = await fetchGithubSponsors()
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
    }, {
      platinum: [],
      gold: [],
      silver: [],
      bronze: [],
      backer: []
    })
  }
}, {
  name: 'github-sponsors',
  maxAge: 60 * 1000
})
