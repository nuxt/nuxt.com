export default defineNuxtRouteMiddleware((to, from) => {
  const user = useStrapiUser()
  if (!user.value) {
    return navigateTo('/login')
  }
})
