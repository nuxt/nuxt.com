import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = session.user?.id || session.id

  const log = useLogger(event)
  log.set({ user: { id: ownerId, authenticated: !!session.user } })

  const chats = await db.query.chats.findMany({
    where: () => eq(schema.chats.userId, ownerId),
    orderBy: () => [
      sql`coalesce(${schema.chats.updatedAt}, ${schema.chats.createdAt}) desc`
    ]
  })

  log.set({ chats: { count: chats.length } })

  return chats
})
