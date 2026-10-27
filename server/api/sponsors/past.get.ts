import type { PastSponsor } from '#shared/types'

export default cachedEventHandler(async (event): Promise<PastSponsor[]> => {
  const [past, ...current] = await Promise.allSettled([
    fetchPastSponsors(),
    fetchGithubSponsors(event),
    fetchOpenCollectiveSponsors()
  ])
  if (past.status === 'rejected') {
    console.warn('[sponsors] Failed to load past sponsors:', past.reason)
    return []
  }

  const currentKeys = new Set(current
    .flatMap(result => result.status === 'fulfilled' ? result.value : [])
    .flatMap(sponsor => [sponsor.sponsorId.toLowerCase(), sponsor.sponsorName?.toLowerCase()]))

  return past.value.filter(sponsor =>
    !currentKeys.has(sponsor.sponsorId.toLowerCase()) && !currentKeys.has(sponsor.sponsorName.toLowerCase()))
}, {
  name: 'sponsors-past',
  getKey: () => 'sponsors-past',
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
