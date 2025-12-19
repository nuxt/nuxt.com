export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()
  const { public: { feedback } } = useRuntimeConfig()

  if (!loggedIn.value) {
    return navigateTo(`${feedback.adminPath}/login`)
  }
})
