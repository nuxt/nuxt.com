import { z } from 'zod'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  const body = z.record(z.string(), z.string()).parse(await readMcpOAuthBody(event, true))
  return adminMcpOAuth(event).token(body, { 'content-type': getHeader(event, 'content-type') || '' })
}))
