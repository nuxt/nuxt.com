import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  await db.delete(schema.agentDailyUsage).where(eq(schema.agentDailyUsage.userId, user.id))
  await db.delete(schema.users).where(eq(schema.users.id, user.id))
  await clearUserSession(event)

  return sendNoContent(event)
})
