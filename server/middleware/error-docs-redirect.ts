/**
 * Redirect unversioned error doc paths to the current default version.
 *
 * The Nuxt runtime links to https://nuxt.com/docs/errors/E1001 (unversioned).
 * This middleware redirects those paths to the current default docs version
 * (e.g., /docs/4.x/errors/e1001) so the content can be resolved.
 *
 * The error code is lowercased to match the content collection path.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // Match /docs/errors/... but NOT /docs/3.x/errors/... or /docs/4.x/errors/...
  const match = path.match(/^\/docs\/errors\/(.+)$/)
  if (match?.[1]) {
    // TODO: update to /docs/5.x when Nuxt 5 is the default
    return sendRedirect(event, `/docs/4.x/errors/${match[1].toLowerCase()}`, 302)
  }
})
