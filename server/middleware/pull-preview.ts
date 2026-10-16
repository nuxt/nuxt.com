import { hasProtocol } from 'ufo'
import { isPullContentPage, parsePullPath } from '#shared/utils/pull'

/**
 * Only preview content pages: any other `/pull/:repo/:number/<path>` redirects to `<path>` in production.
 */
export default defineEventHandler((event) => {
  const preview = parsePullPath(event.path)
  if (!preview || isPullContentPage(preview.path)) return

  // Catches what `parsePullPath()` keeps, like `/\t/evil.com`: browsers drop the tab and leave the site.
  if (hasProtocol(preview.path, { acceptRelative: true })) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid preview path' })
  }

  return sendRedirect(event, preview.path, 302)
})
