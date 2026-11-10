import { z } from 'zod'

export default defineEventHandler(event => mcpOAuthResponse(event, async () => {
  const { user } = await requireUserSession(event)
  const id = z.string().regex(/^[\w-]{43}$/).parse(getQuery(event).request)
  const pending = await pendingMcpConsent(event, id)
  const oauth = adminMcpOAuth(event)
  if (!await oauth.canAuthorize(user.id)) throw createError({ statusCode: 403, statusMessage: 'Nuxt admin access required' })
  const { client } = await oauth.validateAuthorization(pending.request)
  setHeader(event, 'X-Frame-Options', 'DENY')
  return { client, username: user.username }
}))
