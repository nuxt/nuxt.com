// RFC 8414 metadata of the OAuth server behind the admin MCP endpoint.
export default defineEventHandler((event) => {
  setMcpOAuthCors(event)
  if (event.method === 'OPTIONS') return sendNoContent(event)
  if (event.method !== 'GET') throw createError({ statusCode: 405 })
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return mcpOAuthMetadata()
})
