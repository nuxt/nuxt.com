import { createError } from 'evlog'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = session.user?.id || session.id

  const { id, message } = await readValidatedBody(event, z.object({
    id: z.uuid(),
    message: z.object({
      id: z.string(),
      role: z.literal('user'),
      parts: z.array(z.object({ type: z.string() }).loose())
    })
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    chat: { id }
  })

  const [chat] = await db.insert(schema.chats).values({
    id,
    title: null,
    userId: ownerId
  }).returning()

  if (!chat) {
    throw createError({ message: 'Failed to create chat', status: 500, why: 'Insert returned no row.' })
  }

  await db.insert(schema.messages).values({
    id: message.id,
    chatId: chat.id,
    role: 'user',
    parts: message.parts
  })

  return chat
})
