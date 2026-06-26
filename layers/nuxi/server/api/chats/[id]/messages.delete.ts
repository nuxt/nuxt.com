import { createError } from 'evlog'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = await resolveSessionPrincipalId(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { messageId, type } = await readValidatedBody(event, z.object({
    messageId: z.string(),
    type: z.enum(['edit', 'regenerate'])
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    chat: { id },
    truncate: { messageId, type }
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

  const allMessages = await db.select({ id: schema.messages.id, role: schema.messages.role })
    .from(schema.messages)
    .where(eq(schema.messages.chatId, id))
    .orderBy(asc(schema.messages.createdAt), asc(schema.messages.id))

  const targetIndex = allMessages.findIndex((m: { id: string }) => m.id === messageId)
  if (targetIndex === -1) {
    throw createError({ message: 'Message not found', status: 404 })
  }

  const targetRole = allMessages[targetIndex]!.role
  if (type === 'edit' && targetRole !== 'user') {
    throw createError({ message: 'Can only edit user messages', status: 400, why: `Target message role is "${targetRole}".` })
  }
  if (type === 'regenerate' && targetRole !== 'assistant') {
    throw createError({ message: 'Can only regenerate assistant messages', status: 400, why: `Target message role is "${targetRole}".` })
  }

  const startIndex = type === 'edit' ? targetIndex + 1 : targetIndex
  const idsToDelete = allMessages.slice(startIndex).map((m: { id: string }) => m.id)

  log.set({ truncate: { messageId, type, deleted: idsToDelete.length } })

  if (idsToDelete.length > 0) {
    await db.delete(schema.messages).where(and(
      eq(schema.messages.chatId, id),
      inArray(schema.messages.id, idsToDelete)
    ))
  }

  return { success: true }
})
