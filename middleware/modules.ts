export default defineNuxtRouteMiddleware(async () => {
  const { fetch } = useModules()

  await fetch()
})
