import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { messageId, type } = await readValidatedBody(event, z.object({
    messageId: z.string(),
    type: z.enum(['edit', 'regenerate'])
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, session.user?.id || session.id)
    )
  })

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const allMessages = await db.select({ id: schema.messages.id, role: schema.messages.role })
    .from(schema.messages)
    .where(eq(schema.messages.chatId, id))
    .orderBy(asc(schema.messages.createdAt), asc(schema.messages.id))

  const targetIndex = allMessages.findIndex((m: { id: string }) => m.id === messageId)
  if (targetIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Message not found' })
  }

  const targetRole = allMessages[targetIndex]!.role
  if (type === 'edit' && targetRole !== 'user') {
    throw createError({ statusCode: 400, statusMessage: 'Can only edit user messages' })
  }
  if (type === 'regenerate' && targetRole !== 'assistant') {
    throw createError({ statusCode: 400, statusMessage: 'Can only regenerate assistant messages' })
  }

  const startIndex = type === 'edit' ? targetIndex + 1 : targetIndex
  const idsToDelete = allMessages.slice(startIndex).map((m: { id: string }) => m.id)

  if (idsToDelete.length > 0) {
    await db.delete(schema.messages).where(inArray(schema.messages.id, idsToDelete))
  }

  return { success: true }
})
