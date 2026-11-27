import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedParams(event, z.object({
    id: z.uuid()
  }).parse)

  const log = useRequestLogger(event)
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
