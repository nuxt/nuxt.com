export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/docs/') && !to.path.startsWith('/docs/4.x') && !to.path.startsWith('/docs/3.x')) {
    return to.fullPath.replace('/docs', '/docs/4.x')
  }
})
