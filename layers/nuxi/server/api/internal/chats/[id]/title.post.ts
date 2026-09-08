import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const { userId, message } = await readValidatedBody(event, z.object({
    userId: z.string().min(1),
    message: z.object({
      role: z.literal('user'),
      parts: z.array(z.object({ type: z.string() }).loose())
    })
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id),
      eq(schema.chats.userId, userId)
    )
  })

  if (!chat || chat.title) {
    return { title: chat?.title ?? null }
  }

  const generatedTitle = await generateChatTitle(message as UIMessage)
  if (!generatedTitle) {
    return { title: null }
  }

  await db.update(schema.chats).set({ title: generatedTitle }).where(eq(schema.chats.id, id))

  return { title: generatedTitle }
})
