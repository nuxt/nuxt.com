import { and, eq } from 'drizzle-orm'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { LibSQLTransaction } from 'drizzle-orm/libsql'
import { z } from 'zod'

type Tx = LibSQLTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>

const eveSessionCursorSchema = z.object({
  sessionId: z.string().optional(),
  continuationToken: z.string().optional(),
  streamIndex: z.number().int().nonnegative()
})

const chatEveStateSchema = z.object({
  session: eveSessionCursorSchema,
  events: z.array(z.unknown())
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const body = await readValidatedBody(event, z.object({
    state: chatEveStateSchema,
    messages: z.array(z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: uiMessagePartsSchema,
      metadata: z.record(z.string(), z.unknown()).optional()
    })).optional()
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

  await db.transaction(async (tx: Tx) => {
    await tx.update(schema.chats).set({
      state: body.state,
      updatedAt: new Date()
    }).where(eq(schema.chats.id, id))

    if (body.messages?.length) {
      await tx.delete(schema.messages).where(eq(schema.messages.chatId, id))
      await tx.insert(schema.messages).values(body.messages.map(m => ({
        id: m.id,
        chatId: id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata ?? null
      }))).onConflictDoNothing()
    }
  })

  return { ok: true }
})
