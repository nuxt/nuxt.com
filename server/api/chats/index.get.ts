import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return await db.query.chats.findMany({
    where: () => eq(schema.chats.userId, session.user?.id || session.id),
    orderBy: () => desc(schema.chats.createdAt)
  })
})
