import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { title } = await readValidatedBody(event, z.object({
    title: z.string().trim().min(1).max(100)
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: user.id, authenticated: true },
    chat: { id, titleLength: title.length }
  })

  const [updated] = await db.update(schema.chats)
    .set({ title })
    .where(and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, user.id)
    ))
    .returning()

  if (!updated) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  return updated
})
