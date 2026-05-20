import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  // `admin` is a user-initiated opt-in for "share with the Nuxt team for
  // debugging" (see ChatVisibility.vue). Any owner can set it on their own
  // chat — it does not grant the chat owner admin access anywhere else.
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
