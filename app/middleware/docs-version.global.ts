export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/docs/') && !to.path.startsWith('/docs/5.x') && !to.path.startsWith('/docs/4.x') && !to.path.startsWith('/docs/3.x')) {
    // Use a real HTTP redirect (302) so agents and crawlers follow it without
    // parsing a meta-refresh stub. Stays a 302 (not 301) because the target
    // version flips when a new stable release ships, and we don't want stale
    // 301s cached forever in browsers/CDNs pointing at /docs/4.x/*.
    return navigateTo(to.fullPath.replace('/docs', '/docs/4.x'), { redirectCode: 302 })
  }
})
