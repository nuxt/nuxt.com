/**
 * Starts GitHub sign-in, then comes back to `?redirect=` (a path on this site).
 * Better Auth handles the callback (`/api/auth/callback/github`) and creates the session.
 *
 * `?oauth_query=` is the signed authorization request an OAuth client (such as the admin MCP) sent
 * to `/login`. Passed on, it lets Better Auth's OAuth provider resume that request after sign-in;
 * Better Auth verifies its signature.
 */
export default defineEventHandler(async (event) => {
  const { redirect, oauth_query: oauthQuery } = getQuery(event)
  const auth = await useAuth()
  const { headers, response } = await auth.api.signInSocial({
    body: {
      provider: 'github',
      callbackURL: safeRedirectPath(Array.isArray(redirect) ? redirect[0] : redirect) ?? '/',
      errorCallbackURL: '/',
      ...(typeof oauthQuery === 'string' && oauthQuery && { oauth_query: oauthQuery })
    },
    headers: event.headers,
    returnHeaders: true
  })
  return redirectWithCookies(event, headers, response.url!)
})
