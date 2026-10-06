import { CURRENT_DOCS_VERSION, EXAMPLES_PATH_PREFIX, docsPathPrefix, isVersionedDocsPath } from '#shared/utils/docs'

/**
 * Redirect unversioned docs payloads to the current version, keeping the `/_payload.json` suffix.
 *
 * - The ISR renderer strips the suffix before `docs-version.global.ts` runs, so its redirect lands on HTML.
 * - Page requests and client-side navigation stay on that route middleware.
 * - Runs after `error-docs-redirect.ts`, which lowercases error codes.
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/docs/') || !url.pathname.endsWith('/_payload.json')) return

  const pagePath = url.pathname.slice(0, -'/_payload.json'.length)
  if (isVersionedDocsPath(pagePath)) return
  if (pagePath === EXAMPLES_PATH_PREFIX || pagePath.startsWith(`${EXAMPLES_PATH_PREFIX}/`)) return

  // 302 for the same reason as the route middleware: the target flips on each major release.
  return sendRedirect(event, url.pathname.replace('/docs', docsPathPrefix(CURRENT_DOCS_VERSION)) + url.search, 302)
})
