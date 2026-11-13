import { count, eq } from 'drizzle-orm'

/** What the settings page shows about the signed-in account, and what deleting it removes. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const [row, [chats], [messages]] = await Promise.all([
    db.query.users.findFirst({ where: () => eq(schema.users.id, user.id), columns: { createdAt: true } }),
    db.select({ count: count() }).from(schema.chats).where(eq(schema.chats.userId, user.id)),
    db.select({ count: count() }).from(schema.messages)
      .innerJoin(schema.chats, eq(schema.messages.chatId, schema.chats.id))
      .where(eq(schema.chats.userId, user.id))
  ])

  return {
    createdAt: row?.createdAt ?? null,
    chats: chats?.count ?? 0,
    messages: messages?.count ?? 0
  }
})
