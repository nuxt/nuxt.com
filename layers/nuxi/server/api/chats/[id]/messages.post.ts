import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { message } = await readValidatedBody(event, z.object({
    message: z.object({
      id: z.string(),
      role: z.literal('user'),
      parts: z.array(z.object({ type: z.string() }).loose()),
      metadata: z.record(z.string(), z.unknown()).optional()
    })
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, user.id)
    )
  })

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  // A message sent during an answer follows the reply saved just before it. `createdAt` drives read order and is
  // stored with second precision, so keep it at least a second after the latest message.
  const latest = await db.query.messages.findFirst({
    where: () => eq(schema.messages.chatId, id),
    orderBy: () => desc(schema.messages.createdAt),
    columns: { createdAt: true }
  })

  await insertChatMessages(id, [{
    id: message.id,
    role: 'user',
    parts: message.parts as UIMessage['parts'],
    metadata: message.metadata ?? null,
    createdAt: new Date(Math.max(Date.now(), (latest?.createdAt?.getTime() ?? 0) + 1000))
  }])

  return { ok: true }
})
