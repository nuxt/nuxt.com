import { createError } from 'evlog'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = await resolveSessionPrincipalId(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { messageId, isUpvoted } = await readValidatedBody(event, z.object({
    messageId: z.string().min(1),
    isUpvoted: z.boolean().optional()
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    vote: { chatId: id, messageId, isUpvoted: isUpvoted ?? null }
  })

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, ownerId)
    )
  })

  if (!chat) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  const message = await db.query.messages.findFirst({
    where: () => and(
      eq(schema.messages.id, messageId),
      eq(schema.messages.chatId, id)
    )
  })

  if (!message) {
    throw createError({ message: 'Message not found', status: 404 })
  }
  if (message.role !== 'assistant') {
    throw createError({ message: 'Cannot vote on this message', status: 400, why: 'Votes are only allowed on assistant messages.' })
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
