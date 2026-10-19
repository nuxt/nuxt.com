import { CURRENT_DOCS_VERSION, docsPathPrefix, getVersionByPath } from '#shared/utils/docs'

export default defineNuxtRouteMiddleware((to) => {
  // If the path does not start with /docs/, return.
  if (!to.path.startsWith('/docs/')) return

  // If the path starts with a known version, return.
  if (getVersionByPath(to.path)) return

  // Examples are not versioned.
  if (to.path.startsWith('/docs/examples')) return

  // 302 (not 301): the target version flips when a new stable release
  // ships and we don't want browsers/CDNs caching stale 301s pointing at
  // /docs/4.x/*. Note: prerendered pages can't emit a real HTTP redirect,
  // so the static output falls back to a meta-refresh stub — modern
  // crawlers and clients still follow it.
  return navigateTo(to.fullPath.replace('/docs', docsPathPrefix(CURRENT_DOCS_VERSION)), { redirectCode: 302 })
})
