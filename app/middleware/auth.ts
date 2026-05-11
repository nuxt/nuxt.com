export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo(`/api/auth/github?redirect=${encodeURIComponent(to.fullPath)}`, { external: true })
  }
})
