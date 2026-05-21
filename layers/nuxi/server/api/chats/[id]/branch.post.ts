import { createError } from 'evlog'
import { eq, asc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = session.user?.id || session.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { messageId } = await readValidatedBody(event, z.object({
    messageId: z.string().min(1)
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: ownerId, authenticated: !!session.user },
    branch: { sourceChatId: id, messageId }
  })

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, id),
    with: {
      messages: {
        orderBy: () => asc(schema.messages.createdAt)
      }
    }
  })

  if (!chat) {
    throw createError({ message: 'Chat not found', status: 404 })
  }
  if (chat.userId !== ownerId) {
    throw createError({ message: 'Chat not found', status: 404, why: 'Branching is only allowed on chats you own.' })
  }

  type MessageRow = InferSelectModel<typeof schema.messages>

  const cutIndex = chat.messages.findIndex((m: MessageRow) => m.id === messageId)
  const messagesToCopy = cutIndex >= 0
    ? chat.messages.slice(0, cutIndex + 1)
    : chat.messages

  const newChatId = crypto.randomUUID()

  await db.insert(schema.chats).values({
    id: newChatId,
    userId: chat.userId,
    title: chat.title ? `Branch of ${chat.title}` : null,
    visibility: 'private'
  })

  if (messagesToCopy.length) {
    await db.insert(schema.messages).values(
      messagesToCopy.map((m: MessageRow) => ({
        id: crypto.randomUUID(),
        chatId: newChatId,
        role: m.role,
        parts: m.parts as unknown[]
      }))
    )
  }

  log.set({ branch: { newChatId, copiedMessages: messagesToCopy.length, cutMatched: cutIndex >= 0 } })

  return { id: newChatId }
})
