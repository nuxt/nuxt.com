import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = await resolveSessionPrincipalId(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    chat: { id }
  })

  const deleted = await db.delete(schema.chats)
    .where(and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, ownerId)
    ))
    .returning()

  if (!deleted.length) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  return deleted
})
