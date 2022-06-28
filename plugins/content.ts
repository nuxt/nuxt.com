/**
 * Ensure hot reload works with content sources
 */
export default defineNuxtPlugin((nuxt) => {
  if (!process.dev) {
    return
  }

  nuxt.hook('app:data:refresh', async () => {
    if (process.client) {
      const { fetchPage, fetchNavigation } = usePage()

      await fetchNavigation({ force: true })
      await fetchPage({ force: true })
    }
  })
})
