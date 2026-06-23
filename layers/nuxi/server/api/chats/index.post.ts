import { createError } from 'h3'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { LibSQLTransaction } from 'drizzle-orm/libsql'
import { z } from 'zod'

type Tx = LibSQLTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

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
    user: { id: user.id, authenticated: true },
    chat: { id }
  })

  const chat = await db.transaction(async (tx: Tx) => {
    const existing = await tx.query.chats.findFirst({
      where: () => eq(schema.chats.id, id)
    })

    if (existing) {
      if (existing.userId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
      }

      await tx.insert(schema.messages).values({
        id: message.id,
        chatId: id,
        role: 'user',
        parts: message.parts
      }).onConflictDoNothing({ target: [schema.messages.chatId, schema.messages.id] })

      await tx.update(schema.chats).set({
        updatedAt: new Date()
      }).where(eq(schema.chats.id, id))

      return existing
    }

    const [row] = await tx.insert(schema.chats).values({
      id,
      title: null,
      userId: user.id
    }).returning()

    if (!row) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create chat' })
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
