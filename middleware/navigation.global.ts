export default defineNuxtRouteMiddleware(async () => {
  const { fetchNavigation } = usePage()

  return await fetchNavigation()
})
