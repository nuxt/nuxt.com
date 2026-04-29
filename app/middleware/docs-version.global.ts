export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/docs/') && !to.path.startsWith('/docs/5.x') && !to.path.startsWith('/docs/4.x') && !to.path.startsWith('/docs/3.x')) {
    // Use a real HTTP redirect so agents (and crawlers) follow it without
    // parsing a meta-refresh stub that lacks <link rel="canonical">.
    return navigateTo(to.fullPath.replace('/docs', '/docs/4.x'), { redirectCode: 301 })
  }
})
