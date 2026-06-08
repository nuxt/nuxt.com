import type { UIMessage } from 'ai'

export async function createChatWithMessage(
  chatId: string,
  parts: UIMessage['parts'],
  metadata: Record<string, unknown> = {}
): Promise<UIMessage> {
  const userMessage: UIMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    parts,
    metadata: {
      createdAt: new Date().toISOString(),
      ...metadata
    }
  }

  await $fetch('/api/chats', {
    method: 'POST',
    body: { id: chatId, message: userMessage }
  })

  return userMessage
}
