/**
 * Host gate for the `web_fetch` override (see `tools/web_fetch.ts`). Kept here,
 * free of eve imports, so the allowlist is unit-testable on its own: it is the
 * only thing standing between a public chat widget and an arbitrary outbound
 * request.
 */
const ALLOWED_HOST = 'nuxt.com'

export function isAllowedWebFetchUrl(raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }

  // Plain `endsWith(ALLOWED_HOST)` would also match `evilnuxt.com`.
  if (parsed.protocol !== 'https:') return false
  return parsed.hostname === ALLOWED_HOST || parsed.hostname.endsWith(`.${ALLOWED_HOST}`)
}
