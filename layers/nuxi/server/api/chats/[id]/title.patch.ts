import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = await resolveSessionPrincipalId(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { title } = await readValidatedBody(event, z.object({
    title: z.string().trim().min(1).max(100)
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    chat: { id, titleLength: title.length }
  })

  const [updated] = await db.update(schema.chats)
    .set({ title })
    .where(and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, ownerId)
    ))
    .returning()

  if (!updated) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  return updated
})
