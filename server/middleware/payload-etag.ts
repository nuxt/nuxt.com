import { hash } from 'ohash'

/**
 * A weak `etag` on `_payload.json`, so client-side navigation to these pages can send a
 * conditional request instead of always re-downloading the payload body.
 *
 * Vercel's edge answers `304` from a stored ISR entry once its response carries an `etag`.
 */
const ETAGGABLE_PREFIXES = [
  '/docs',
  '/blog',
  '/deploy',
  '/templates',
  '/design-kit',
  '/newsletter',
  '/video-courses',
  '/enterprise/agencies',
  '/enterprise/support'
]

function isEtaggablePayload(pagePath: string): boolean {
  return ETAGGABLE_PREFIXES.some(prefix => pagePath === prefix || pagePath.startsWith(`${prefix}/`))
}

export default defineEventHandler(async (event) => {
  if (import.meta.dev) return

  const { pathname } = getRequestURL(event)
  if (!pathname.endsWith('/_payload.json')) return

  const pagePath = pathname.slice(0, -'/_payload.json'.length) || '/'
  if (!isEtaggablePayload(pagePath)) return

  try {
    const shas = await Promise.all(CONTENT_INSTANCE_KEYS.map(key => resolveInstanceSha(key)))
    setResponseHeader(event, 'etag', `W/"${hash(shas)}"`)
  } catch {
    // Never fail a payload request over a cache validator.
  }
})
