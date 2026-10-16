import { isNuxtersPeriod } from '#shared/utils/nuxters'

/**
 * `/nuxters` pages cache one ISR entry per `?period=` value (`allowQuery` in nuxt.config.ts).
 * Send an invalid or repeated value to the page without it, before any render.
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname !== '/nuxters' && !url.pathname.startsWith('/nuxters/')) return
  if (!url.searchParams.has('period')) return

  const values = url.searchParams.getAll('period')
  if (values.length === 1 && isNuxtersPeriod(values[0])) return

  url.searchParams.delete('period')
  return sendRedirect(event, `${url.pathname}${url.search}`, 301)
})
