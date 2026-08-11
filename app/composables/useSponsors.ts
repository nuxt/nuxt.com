import type { Sponsor, SponsorType } from '#shared/types'
import { clientContent } from '~/composables/client-content'

type SponsorsByTier = Partial<Record<SponsorType, Sponsor[]>>

function isEmptySponsorsByTier(data: SponsorsByTier | null | undefined) {
  return !data || Object.values(data).every(tier => !tier?.length)
}

export const useSponsors = async () => {
  const [{ data: apiSponsors }, { data: manualSponsorsPage }] = await Promise.all([
    useFetch<SponsorsByTier>('/api/sponsors', {
      key: 'sponsors',
      getCachedData(key, nuxtApp) {
        const data = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
        return isEmptySponsorsByTier(data) ? undefined : data
      }
    }),
    useAsyncData('manual-sponsors', () => clientContent.get('/enterprise/manual-sponsors'))
  ])

  const sponsors = computed(() => {
    // `sponsors` in the local source is either a landing-page section (index.yml)
    // or the manual sponsor list (manual-sponsors.yml) — narrow to the list.
    const manualData = manualSponsorsPage.value?.data.sponsors
    const manual = Array.isArray(manualData) ? manualData : []

    const result: Record<string, Sponsor[]> = {}

    for (const [tier, sponsorsList] of Object.entries(apiSponsors.value || {})) {
      result[tier] = [...sponsorsList]
    }

    for (const manualSponsor of manual) {
      const tier = manualSponsor.tier || 'backers'
      if (!result[tier]) {
        result[tier] = []
      }
      result[tier].push(manualSponsor as Sponsor)
    }

    return result
  })

  const getFilteredSponsors = (tiers: string[]) => {
    return computed(() => {
      return Object.entries(sponsors.value)
        .filter(([tier, sponsors]) => tiers.includes(tier) && sponsors.length > 0)
        .map(([tier, sponsors]) => ({
          tier,
          sponsors: sponsors.map(s => ({
            sponsorName: s.sponsorName,
            sponsorLogo: s.sponsorLogo,
            sponsorUrl: s.sponsorUrl
          }))
        }))
    })
  }

  return {
    sponsors,
    getFilteredSponsors
  }
}
