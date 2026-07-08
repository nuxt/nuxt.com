import type { UIMessage } from 'ai'
import type { EveMessage } from 'eve/vue'
import type { AgentChatStatus } from './types'

export function eveMessagesToUIMessages(messages: readonly EveMessage[]): UIMessage[] {
  return [...messages] as UIMessage[]
}

export function normalizeEveParts(parts: UIMessage['parts']): UIMessage['parts'] {
  return parts.filter(part => part.type !== 'step-start')
}

export function hasVisibleParts(parts: UIMessage['parts']): boolean {
  return normalizeEveParts(parts).some((part) => {
    if (part.type === 'text' || part.type === 'reasoning') {
      return 'text' in part && typeof part.text === 'string' && part.text.length > 0
    }
    return part.type.startsWith('tool-') || part.type === 'dynamic-tool'
  })
}

/** Keep the loading indicator until the assistant message has renderable content. */
export function resolveChatDisplayState(
  messages: UIMessage[],
  status: AgentChatStatus
): { displayStatus: AgentChatStatus, displayMessages: UIMessage[] } {
  if (status !== 'streaming') {
    return { displayStatus: status, displayMessages: messages }
  }

  const last = messages.at(-1)
  if (last?.role === 'assistant' && !hasVisibleParts(last.parts)) {
    return {
      displayStatus: 'submitted',
      displayMessages: messages.slice(0, -1)
    }
  }

  return { displayStatus: status, displayMessages: messages }
}
