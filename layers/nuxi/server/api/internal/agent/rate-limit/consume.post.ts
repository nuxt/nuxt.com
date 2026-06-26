import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { userId: claimedUserId } = await readValidatedBody(event, z.object({
    userId: z.string().min(1)
  }).parse)

  const sessionUserId = await resolveInternalPrincipalId(event)
  if (sessionUserId && sessionUserId !== claimedUserId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const userId = sessionUserId ?? claimedUserId

  try {
    return await consumeAgentRateLimitForUser(userId)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: (error as { message?: string }).message ?? 'Daily message limit reached.'
      })
    }
    throw error
  }
})
