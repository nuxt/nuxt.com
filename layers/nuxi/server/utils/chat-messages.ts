import { eq } from 'drizzle-orm'
import type { UIMessage } from 'ai'

export interface ChatMessageInsert {
  id?: string
  role: 'user' | 'assistant' | 'system'
  parts: UIMessage['parts']
  metadata?: Record<string, unknown> | null
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
    metadata: message.metadata ?? null
  }))).onConflictDoNothing({ target: [schema.messages.chatId, schema.messages.id] })

  if (options?.touchUpdatedAt !== false) {
    await db.update(schema.chats).set({
      updatedAt: new Date()
    }).where(eq(schema.chats.id, chatId))
  }
}
