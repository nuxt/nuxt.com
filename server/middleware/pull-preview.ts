import { isPullContentPage, parsePullPath } from '#shared/utils/pull'

/**
 * Only preview content pages: any other `/pull/:repo/:number/<path>` redirects to `<path>` in production.
 */
export default defineEventHandler((event) => {
  const preview = parsePullPath(event.path)
  if (!preview || isPullContentPage(preview.path)) return

  return sendRedirect(event, preview.path, 302)
})
