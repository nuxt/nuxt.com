import { count, eq, and, gt } from 'drizzle-orm'
import { oauthHash } from '../../../lib/admin-mcp-oauth'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  const key = oauthHash(getRequestIP(event, { xForwardedFor: true }) || 'unknown')
  const [usage] = await db.select({ count: count() }).from(schema.mcpOAuthClients).where(and(
    eq(schema.mcpOAuthClients.registrationKey, key),
    gt(schema.mcpOAuthClients.createdAt, new Date(Date.now() - 3600_000))
  ))
  if (usage!.count >= 20) throw createError({ statusCode: 429, statusMessage: 'Too many client registrations. Try again later.' })
  const result = await adminMcpOAuth(event).register(await readMcpOAuthBody(event), key)
  setResponseStatus(event, 201)
  return result
}))
