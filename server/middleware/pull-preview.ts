import { decodePath, hasProtocol } from 'ufo'
import { isPullContentPage, parsePullPath } from '#shared/utils/pull'
import { createError, defineHandler, sendRedirect } from 'nuxt/server'

/**
 * Only preview content pages: any other `/pull/:repo/:number/<path>` redirects to `<path>` in production.
 */
export default defineHandler((event) => {
  const preview = parsePullPath(decodePath(event.url.pathname) + event.url.search)
  if (!preview || isPullContentPage(preview.path)) return

  // Catches what `parsePullPath()` keeps, like `/\t/evil.com`: browsers drop the tab and leave the site.
  if (hasProtocol(preview.path, { acceptRelative: true })) {
    throw createError({ status: 400, statusText: 'Invalid preview path' })
  }

  return sendRedirect(event, preview.path, 302)
})
