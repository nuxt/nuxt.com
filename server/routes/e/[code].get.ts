/**
 * Short URL handler for Nuxt error codes.
 *
 * Redirects /e/NUXT_E1001 → /docs/4.x/errors/e1001
 * Redirects /e/NUXT_B1001 → /docs/4.x/errors/b1001
 *
 * The error code format is NUXT_ followed by E or B and 1-4 digits.
 * The NUXT_ prefix is stripped, the code is lowercased, and the user
 * is redirected to the current default docs version.
 */
export default defineEventHandler((event) => {
  const code = getRouterParam(event, 'code')

  // Validate: must be NUXT_ followed by E or B and 1-4 digits
  if (!code || !/^NUXT_[EB]\d{1,4}$/i.test(code)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // Strip the NUXT_ prefix and lowercase → e1001 or b1001
  const errorCode = code.replace('NUXT_', '').toLowerCase()

  // TODO: update to /docs/5.x when Nuxt 5 is the default
  return sendRedirect(event, `/docs/4.x/errors/${errorCode}`, 302)
})
