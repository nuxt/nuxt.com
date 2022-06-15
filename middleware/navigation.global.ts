export default defineNuxtRouteMiddleware(async () => {
  const { fetchNavigation } = useContent()

  return await fetchNavigation()
})
