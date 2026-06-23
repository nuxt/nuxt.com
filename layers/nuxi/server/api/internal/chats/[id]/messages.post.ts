import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { userId, messages } = await readValidatedBody(event, z.object({
    userId: z.string().min(1),
    messages: z.array(z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: z.array(z.object({ type: z.string() }).loose())
    })).min(1)
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, userId)
    )
  })

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  await insertChatMessages(id, messages.map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts as UIMessage['parts']
  })), { touchUpdatedAt: false })

  return { ok: true }
})
