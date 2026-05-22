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

  // @ts-expect-error - type for the transaction.
  const chat = await db.transaction(async (tx) => {
    const [row] = await tx.insert(schema.chats).values({
      id,
      title: null,
      userId: ownerId
    }).returning()

    if (!row) {
      throw createError({ message: 'Failed to create chat', status: 500, why: 'Insert returned no row.' })
    }

    await tx.insert(schema.messages).values({
      id: message.id,
      chatId: row.id,
      role: 'user',
      parts: message.parts
    })

    return row
  })

  return chat
})
