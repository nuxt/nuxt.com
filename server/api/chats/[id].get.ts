import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, id),
    with: {
      messages: {
        orderBy: () => asc(schema.messages.createdAt)
      }
    }
  })

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const userId = session.user?.id || session.id
  const isOwner = chat.userId === userId
  const isAdmin = session.user?.role === 'admin'

  const canView = isOwner
    || chat.visibility === 'public'
    || (chat.visibility === 'admin' && isAdmin)
  if (!canView) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const { userId: _, ...rest } = chat
  return { ...rest, isOwner }
})
