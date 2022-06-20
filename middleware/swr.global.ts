// ~/middleware/swr.global.ts
export default defineNuxtRouteMiddleware(() => {
  // Activate only on server side
  if (process.client) { return }

  // Don't cache if user is authenticated (payload projection)
  // TODO later: handle Nuxt generic session system to know if page is personnalized for a specific user
  const user = useStrapiUser()
  if (user.value) { return }

  // TODO later: use Route.meta.cache to determine if we should cache
  const route = useRequestEvent().req.url

  // Ignore authenticated page
  if (route.startsWith('/@') || route.startsWith('/teams/new')) { return }

  // TODO: uncomment below once we move auth button in header on client-side (display a placeholder instead on SSR)
  if (route.startsWith('/modules') || route.startsWith('/community/repositories') || route.startsWith('/community/nuxters')) {
    // useRequestEvent().res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59')
  }

  // All others pages, cache it til next deployment
  // useRequestEvent().res.setHeader('Cache-Control', 'public,max-age=31536000,immutable')
})
