import { eq, sql } from 'drizzle-orm'
import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const log = useRequestLogger(event)
  log.set({ user: { id: user.id, authenticated: true } })

  const chats = await db.query.chats.findMany({
    where: () => eq(schema.chats.userId, user.id),
    orderBy: () => [
      sql`coalesce(${schema.chats.updatedAt}, ${schema.chats.createdAt}) desc`
    ]
  })

  log.set({ chats: { count: chats.length } })

  return chats
})
