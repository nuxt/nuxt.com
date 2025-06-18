export default defineEventHandler(async (event) => {
  const protectedRoutes = [
    '/api/feedback'
  ]

  if (!protectedRoutes.some(route => event.path?.startsWith(route))) return

  const { user } = await requireUserSession(event)

  const adminMember = await isCoreTeamMember(user.login.toLowerCase())

  if (!adminMember) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
