const publicOAuthPaths = new Set([
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource/mcp/admin',
  '/api/mcp/oauth/register', '/api/mcp/oauth/token', '/api/mcp/oauth/revoke'
])

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (path === '/mcp/authorize') {
    setHeader(event, 'Content-Security-Policy', 'frame-ancestors \'none\'')
    setHeader(event, 'X-Frame-Options', 'DENY')
    setHeader(event, 'Referrer-Policy', 'no-referrer')
    setHeader(event, 'Cache-Control', 'no-store')
  }
  if (!publicOAuthPaths.has(path)) return
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
