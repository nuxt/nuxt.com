import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { messageId, isUpvoted } = await readValidatedBody(event, z.object({
    messageId: z.string(),
    isUpvoted: z.boolean().optional()
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

  const message = await db.query.messages.findFirst({
    where: () => and(
      eq(schema.messages.id, messageId),
      eq(schema.messages.chatId, id)
    )
  })

  if (!message) {
    throw createError({ statusCode: 404, statusMessage: 'Message not found' })
  }
  if (message.role !== 'assistant') {
    throw createError({ statusCode: 400, statusMessage: 'Can only vote on assistant messages' })
  }

  if (isUpvoted === undefined) {
    await db.delete(schema.votes).where(and(
      eq(schema.votes.chatId, id),
      eq(schema.votes.messageId, messageId)
    ))
  } else {
    await db.insert(schema.votes).values({
      chatId: id,
      messageId,
      isUpvoted
    }).onConflictDoUpdate({
      target: [schema.votes.chatId, schema.votes.messageId],
      set: { isUpvoted }
    })
  }

  return { chatId: id, messageId, isUpvoted }
})
