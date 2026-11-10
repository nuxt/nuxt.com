import { oauthHash, oauthSecret } from '../../../lib/admin-mcp-oauth'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  const { request } = await adminMcpOAuth(event).validateAuthorization(getQuery(event))
  const id = oauthSecret()
  const browser = getCookie(event, 'mcp-oauth-browser') || oauthSecret()
  setCookie(event, 'mcp-oauth-browser', browser, {
    httpOnly: true, secure: adminMcpOAuthUrls(event).issuer.startsWith('https:'),
    sameSite: 'lax', path: '/api/mcp/oauth', maxAge: 600
  })
  const pending: PendingMcpConsent = { request, browserHash: oauthHash(browser), expiresAt: Date.now() + 600_000 }
  await kv.set(`mcp:consent:${id}`, pending, { ttl: 600 })
  const path = `/mcp/authorize?request=${id}`
  const { user } = await getUserSession(event)
  return sendRedirect(event, user ? path : `/api/auth/github?redirect=${encodeURIComponent(path)}`)
}))
