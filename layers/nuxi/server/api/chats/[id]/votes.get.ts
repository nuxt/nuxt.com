import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = session.user?.id || session.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    chat: { id }
  })

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, ownerId)
    )
  })

  if (!chat) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  return await db.select().from(schema.votes).where(eq(schema.votes.chatId, id))
})
