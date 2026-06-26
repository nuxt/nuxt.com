import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: user.id, authenticated: true },
    chat: { id }
  })

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, user.id)
    )
  })

  if (!chat) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  return await db.select().from(schema.votes).where(eq(schema.votes.chatId, id))
})
