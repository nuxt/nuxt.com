import { SUPPORTED_DOC_VERSIONS, EXCLUDED_DOC_VERSIONS, CURRENT_DOCS_VERSION } from '#shared/utils/docs'

// Versions kept here as a fast prefix scan — the canonical list lives in
// `shared/utils/docs.ts` (SUPPORTED_DOC_VERSIONS + EXCLUDED_DOC_VERSIONS).
const KNOWN_DOC_VERSIONS = [...SUPPORTED_DOC_VERSIONS, ...EXCLUDED_DOC_VERSIONS]

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/docs/')) return
  if (KNOWN_DOC_VERSIONS.some(v => to.path.startsWith(`/docs/${v}`))) return

  // 302 (not 301): the target version flips when a new stable release
  // ships and we don't want browsers/CDNs caching stale 301s pointing at
  // /docs/4.x/*. Note: prerendered pages can't emit a real HTTP redirect,
  // so the static output falls back to a meta-refresh stub — modern
  // crawlers and clients still follow it.
  return navigateTo(to.fullPath.replace('/docs', `/docs/${CURRENT_DOCS_VERSION}`), { redirectCode: 302 })
})
