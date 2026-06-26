import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { userId: claimedUserId } = await readValidatedBody(event, z.object({
    userId: z.string().min(1)
  }).parse)

  const sessionUserId = await getRateLimitPrincipalId(event)

  if (sessionUserId) {
    if (sessionUserId !== claimedUserId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    return await consumeAgentRateLimitForUser(sessionUserId)
  }

  // Eve authenticated before the browser cookie had an anonymous id (internal fetch
  // cannot persist Set-Cookie back to the browser). Internal bearer auth is sufficient.
  return await consumeAgentRateLimitForUser(claimedUserId)
})
