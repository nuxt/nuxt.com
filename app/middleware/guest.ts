export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  // An OAuth client can ask a signed-in user to sign in again (`prompt=login`): its signed request
  // (`sig`) has to reach the login page.
  if (loggedIn.value && !to.query.sig) {
    return navigateTo('/')
  }
})
