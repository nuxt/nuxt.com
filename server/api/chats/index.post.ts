import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const { id, message } = await readValidatedBody(event, z.object({
    id: z.uuid(),
    message: z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: z.array(z.object({ type: z.string() }).loose())
    })
  }).parse)

  const [chat] = await db.insert(schema.chats).values({
    id,
    title: null,
    userId: session.user?.id || session.id
  }).returning()

  if (!chat) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create chat' })
  }

  await db.insert(schema.messages).values({
    id: message.id,
    chatId: chat.id,
    role: 'user',
    parts: message.parts
  })

  return chat
})
