export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/docs/') && !to.path.startsWith('/docs/5.x') && !to.path.startsWith('/docs/4.x') && !to.path.startsWith('/docs/3.x')) {
    // 302 (not 301): the target version flips when a new stable release
    // ships and we don't want browsers/CDNs caching stale 301s pointing at
    // /docs/4.x/*. Note: prerendered pages can't emit a real HTTP redirect,
    // so the static output falls back to a meta-refresh stub — modern
    // crawlers and clients still follow it.
    return navigateTo(to.fullPath.replace('/docs', '/docs/4.x'), { redirectCode: 302 })
  }
})
