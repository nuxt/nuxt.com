import { computed, shallowReactive, watch } from 'vue'
import type { Ref } from 'vue'
import type { NuxtersPage, NuxterSummary } from '#shared/types'

export function useNuxtersCountryPeople({ leaderboard, country, period }: {
  leaderboard: Ref<NuxtersPage | undefined>
  country: Ref<string | null>
  period: Ref<string | undefined>
}) {
  const pages = shallowReactive(new Map<string, NuxterSummary[]>())

  watch(leaderboard, (page) => {
    if (page?.country) {
      pages.set(`${page.period}:${page.country}`, page.items.slice(0, 12))
    }
  }, { immediate: true, flush: 'sync' })

  return computed(() => {
    if (!country.value || !period.value) return []
    return pages.get(`${period.value}:${country.value}`) ?? []
  })
}
