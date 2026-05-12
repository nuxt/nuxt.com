import { desc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return await db.query.chats.findMany({
    where: () => eq(schema.chats.userId, session.user?.id || session.id),
    orderBy: () => [
      sql`coalesce(${schema.chats.updatedAt}, ${schema.chats.createdAt}) desc`
    ]
  })
})
