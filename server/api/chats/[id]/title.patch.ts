import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { title } = await readValidatedBody(event, z.object({
    title: z.string().trim().min(1).max(100)
  }).parse)

  const [updated] = await db.update(schema.chats)
    .set({ title })
    .where(and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, session.user?.id || session.id)
    ))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  return updated
})
