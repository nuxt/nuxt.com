export default defineNuxtRouteMiddleware((to, from) => {
  const user = useStrapiUser()
  if (!user.value) {
    useCookie('redirect', { path: '/' }).value = to.fullPath
    return navigateTo('/login')
  }
})
