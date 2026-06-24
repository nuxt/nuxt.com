export default defineEventHandler(async (event) => {
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

  return {
    principalId: session.id,
    principalType: 'anonymous' as const,
    authenticated: false
  }
})
