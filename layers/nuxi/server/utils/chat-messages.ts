import { eq, sql, type SQL } from 'drizzle-orm'
import type { UIMessage } from 'ai'

export interface ChatMessageInsert {
  id?: string
  role: 'user' | 'assistant' | 'system'
  parts: UIMessage['parts']
  metadata?: Record<string, unknown> | null
  createdAt?: Date | SQL
}

/**
 * `createdAt` for a message appended to a chat: now, or a second after the chat's latest message when that is later.
 * `createdAt` drives read order and is stored in seconds, and a message sent during an answer must follow the reply
 * saved just before it. Evaluated inside the insert, so concurrent inserts and the rows of one batch each see the rows
 * before them.
 */
export function appendedMessageCreatedAt(chatId: string) {
  const latest = sql`(select max(${schema.messages.createdAt}) from ${schema.messages} where ${schema.messages.chatId} = ${chatId})`
  return sql`max(unixepoch(), coalesce(${latest} + 1, 0))`
}

export async function insertChatMessages(
  chatId: string,
  messages: ChatMessageInsert[],
  options?: { touchUpdatedAt?: boolean }
) {
  if (!messages.length) return

  await db.insert(schema.messages).values(messages.map(message => ({
    id: message.id ?? crypto.randomUUID(),
    chatId,
    role: message.role,
    parts: message.parts,
    metadata: message.metadata ?? null,
    ...(message.createdAt ? { createdAt: message.createdAt } : {})
  }))).onConflictDoNothing({ target: [schema.messages.chatId, schema.messages.id] })

  if (options?.touchUpdatedAt !== false) {
    await db.update(schema.chats).set({
      updatedAt: new Date()
    }).where(eq(schema.chats.id, chatId))
  }
}
