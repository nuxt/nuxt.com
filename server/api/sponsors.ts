import { fetchGithubSponsors, fetchOpenCollectiveSponsors } from '../utils/sponsors'
import { defineCachedEventHandler } from '#imports'

const tiersMap = {
  platinum: amount => amount >= 2000,
  gold: amount => amount >= 1000 && amount < 2000,
  silver: amount => amount >= 100 && amount < 1000,
  bronze: amount => amount >= 10 && amount < 100,
  backer: amount => amount < 10
}

export default defineCachedEventHandler(async () => {
  let sponsors = null
  const oc = null

  try {
    sponsors = await Promise.all([fetchGithubSponsors(), fetchOpenCollectiveSponsors()])
  } catch (e) {
    console.error(e)
    return
  }

  return sponsors.flat().reduce((acc, sponsor) => {
    const tier = Object.keys(tiersMap).find(tier => tiersMap[tier](sponsor.monthlyPriceInDollars))
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
  name: 'github-sponsors',
  /* 1 hour */
  maxAge: 60 * 1000 * 60 * 60
})
