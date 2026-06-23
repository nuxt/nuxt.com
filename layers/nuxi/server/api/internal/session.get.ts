export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const session = await getUserSession(event)
  const user = session.user as { id: string, login?: string, name?: string, avatar?: string } | null

  if (user) {
    return {
      principalId: user.id,
      principalType: 'user' as const,
      authenticated: true,
      attributes: {
        login: user.login,
        name: user.name,
        avatar: user.avatar
      }
    }
  }

  return {
    principalId: session.id,
    principalType: 'anonymous' as const,
    authenticated: false
  }
})
