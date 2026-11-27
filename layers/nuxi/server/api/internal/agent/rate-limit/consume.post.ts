import { z } from 'zod'
import { createError, defineHandler, readValidatedBody } from 'nuxt/server'

export default defineHandler(async (event) => {
  requireInternalRequest(event)

  const { userId: claimedUserId, defaultLimit } = await readValidatedBody(event, z.object({
    userId: z.string().min(1),
    defaultLimit: z.number().int().positive().optional()
  }).parse)

  const sessionUserId = await getRateLimitPrincipalId(event)

  if (sessionUserId) {
    if (sessionUserId !== claimedUserId) {
      throw createError({ status: 403, statusText: 'Forbidden' })
    }
    return await consumeAgentRateLimit(event)
  }

  // Eve authenticated before the browser cookie had an anonymous id (internal fetch
  // cannot persist Set-Cookie back to the browser). Internal bearer auth is sufficient.
  return await consumeAgentRateLimitForUser(claimedUserId, defaultLimit)
})
