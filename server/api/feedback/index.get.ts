export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  return await db.select().from(schema.feedback)
})
