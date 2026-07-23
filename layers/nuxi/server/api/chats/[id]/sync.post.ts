import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * End-of-turn sync: upserts the turn's assistant messages and stores the
 * session stream cursor. User messages are persisted at send time, so DB
 * history is append-only — nothing is ever deleted or reordered.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const body = await readValidatedBody(event, z.object({
    messages: z.array(z.object({
      id: z.string().min(1),
      role: z.literal('assistant'),
      parts: uiMessagePartsSchema,
      metadata: z.record(z.string(), z.unknown()).optional()
    })).default([]),
    session: z.object({
      sessionId: z.string().min(1),
      streamIndex: z.number().int().nonnegative()
    }).optional()
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

  const now = Date.now()

  await db.transaction(async (tx) => {
    for (const [index, message] of body.messages.entries()) {
      await tx.insert(schema.messages).values({
        id: message.id,
        chatId: id,
        role: 'assistant',
        parts: message.parts,
        metadata: message.metadata ?? null,
        // Spread batch rows by one second: createdAt drives read order and is
        // stored with second precision. Conflicts keep their original value.
        createdAt: new Date(now + index * 1000)
      }).onConflictDoUpdate({
        target: [schema.messages.chatId, schema.messages.id],
        set: {
          parts: message.parts,
          metadata: message.metadata ?? null
        }
      })
    }

    await tx.update(schema.chats).set({
      updatedAt: new Date(),
      ...(body.session ? { state: body.session } : {})
    }).where(eq(schema.chats.id, id))
  })

  return { ok: true }
})
