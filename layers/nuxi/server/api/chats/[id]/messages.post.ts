import { and, eq, sql } from 'drizzle-orm'
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
  // stored in seconds, so keep it a second after the latest message. Computed in the insert itself, so two concurrent
  // posts can't read the same latest message.
  const latest = sql`(select max(${schema.messages.createdAt}) from ${schema.messages} where ${schema.messages.chatId} = ${id})`
  await insertChatMessages(id, [{
    id: message.id,
    role: 'user',
    parts: message.parts as UIMessage['parts'],
    metadata: message.metadata ?? null,
    createdAt: sql`max(unixepoch(), coalesce(${latest} + 1, 0))`
  }])

  return { ok: true }
})
