import { z } from 'zod'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  const { token, client_id } = z.object({ token: z.string().max(512), client_id: z.string().max(256) }).parse(await readMcpOAuthBody(event, true))
  await adminMcpOAuth(event).revoke(token, client_id)
  setResponseStatus(event, 200)
  return ''
}))
