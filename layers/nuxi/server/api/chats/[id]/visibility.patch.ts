import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { visibility } = await readValidatedBody(event, z.object({
    visibility: z.enum(['public', 'private', 'admin'])
  }).parse)

  const [updated] = await db.update(schema.chats)
    .set({ visibility })
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
