import type { Stats } from '~/composables/useStats'

export default defineNuxtPlugin(async () => {
  const stats = useStats()

  if (import.meta.server) {
    stats.value = await $fetch<Stats>('/api/stats').catch(() => null)
  }
  onNuxtReady(async () => {
    if (!stats.value) {
      stats.value = await $fetch<Stats>('/api/stats')
    }
  })
})
