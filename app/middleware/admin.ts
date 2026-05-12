export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo(`/api/auth/github?redirect=${encodeURIComponent(to.fullPath)}`, { external: true })
  }

  if (!user.value || user.value.role !== 'admin') {
    return navigateTo('/')
  }
})
