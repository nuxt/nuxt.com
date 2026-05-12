import { eq, asc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401 })
  }

  const id = getRouterParam(event, 'id')!
  const { messageId } = await readBody<{ messageId: string }>(event)

  if (!messageId || typeof messageId !== 'string' || messageId.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'messageId is required' })
  }

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, id),
    with: {
      messages: {
        orderBy: () => asc(schema.messages.createdAt)
      }
    }
  })

  if (!chat || chat.userId !== session.user!.id) {
    throw createError({ statusCode: 403 })
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

  return { id: newChatId }
})
