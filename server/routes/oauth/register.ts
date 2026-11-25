// RFC 7591 dynamic client registration for MCP clients.
export default defineEventHandler(async (event) => {
  setMcpOAuthCors(event)
  if (event.method === 'OPTIONS') return sendNoContent(event)
  if (event.method !== 'POST') throw createError({ statusCode: 405 })

  try {
    const body = await readBody(event).catch(() => null)
    if (!body || typeof body !== 'object') {
      throw new McpOAuthError('invalid_client_metadata', 'Send the client metadata as a JSON object.')
    }
    const client = await registerMcpOAuthClient(body)
    setResponseStatus(event, 201)
    setResponseHeader(event, 'cache-control', 'no-store')
    return client
  } catch (error) {
    return sendMcpOAuthError(event, error)
  }
})
