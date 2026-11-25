const BASE = 'http://localhost'

/**
 * The same-origin path to send a user to after sign-in, or `null`. Resolved
 * the way the browser resolves `Location`, so `/\evil.com` or a tab inside
 * `//` can't point at another origin.
 */
export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null

  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return null
  }

  return url.origin === BASE ? url.pathname + url.search + url.hash : null
}
