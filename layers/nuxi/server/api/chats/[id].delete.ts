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

  const deleted = await db.delete(schema.chats)
    .where(and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, user.id)
    ))
    .returning()

  if (!deleted.length) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  await endEveSessions(event, deleted.map(chat => chat.state?.sessionId))

  return deleted
})
