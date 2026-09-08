import { and, eq } from 'drizzle-orm'
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

  await insertChatMessages(id, [{
    id: message.id,
    role: 'user',
    parts: message.parts as UIMessage['parts'],
    metadata: message.metadata ?? null
  }])

  return { ok: true }
})
