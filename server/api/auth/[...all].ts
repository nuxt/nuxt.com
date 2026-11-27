import { defineHandler } from 'nuxt/server'

/** Better Auth's endpoints: OAuth callbacks, `get-session`, `sign-out`… */
export default defineHandler(async (event) => {
  const auth = await useAuth()
  const response = await auth.handler(event.req)
  // MCP clients open the authorization endpoint in the browser, but Better Auth answers it with
  // `{ redirect, url }` JSON when it takes the request for a `fetch`. Where the Vercel Toolbar is on
  // (previews by default), Vercel proxies HTML navigations so they reach the app looking like one.
  // Nothing on the site fetches this endpoint, so it always redirects.
  if (event.req.method === 'GET' && new URL(event.req.url).pathname === '/api/auth/oauth2/authorize'
    && response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
    const body = await response.clone().json().catch(() => undefined) as { redirect?: unknown, url?: unknown } | undefined
    if (body?.redirect === true && typeof body.url === 'string') {
      const headers = new Headers(response.headers)
      headers.delete('content-type')
      headers.delete('content-length')
      // Relative URLs stay relative: behind Vercel the request URL is `http://`.
      headers.set('location', body.url)
      return new Response(null, { status: 302, headers })
    }
  }
  return response
})
