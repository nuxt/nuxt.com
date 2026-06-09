import type { UIMessage } from 'ai'
import { format } from 'date-fns'

export function toUIMessages(rows: ChatMessageRow[]): UIMessage[] {
  return rows.map(m => ({
    id: m.id,
    role: m.role,
    parts: m.parts as UIMessage['parts'],
    metadata: { createdAt: m.createdAt }
  }))
}

export function messageTime(message: UIMessage): string | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt
  return raw ? format(new Date(raw), 'h:mm a') : null
}

export function messageFullTime(message: UIMessage): string | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt
  return raw ? format(new Date(raw), 'MMM d, yyyy, h:mm a') : null
}

export function titleFromParts(parts: UIMessage['parts']): string {
  const text = parts
    .filter((part): part is { type: 'text', text: string } => part.type === 'text')
    .map(part => part.text)
    .join(' ')
    .trim()

  if (!text) return 'Untitled'
  return text.length > 40 ? `${text.slice(0, 37)}…` : text
}

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
