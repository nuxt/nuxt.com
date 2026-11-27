import { createError, defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  requireInternalRequest(event)

  const session = await getUserSession(event)
  const user = session.user

  if (user) {
    return {
      principalId: user.id,
      principalType: 'user' as const,
      authenticated: true,
      attributes: {
        login: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    }
  }

  const principalId = await getRateLimitPrincipalId(event)
  if (!principalId) {
    throw createError({
      status: 401,
      statusText: 'Anonymous session not initialized'
    })
  }

  return {
    principalId,
    principalType: 'anonymous' as const,
    authenticated: false
  }
})
