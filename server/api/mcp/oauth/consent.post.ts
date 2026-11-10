import { z } from 'zod'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  requireMcpConsentOrigin(event)
  const { user } = await requireUserSession(event)
  const { request, allow } = z.object({
    request: z.string().regex(/^[\w-]{43}$/), allow: z.boolean()
  }).parse(await readMcpOAuthBody(event))
  const pending = await pendingMcpConsent(event, request)
  await kv.del(`mcp:consent:${request}`)
  return { redirect: await adminMcpOAuth(event).authorize(pending.request, user.id, allow) }
}))
