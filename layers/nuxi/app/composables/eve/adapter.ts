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

/**
 * Drop assistant messages that never got renderable content (e.g. a turn
 * stopped right after `step.started` persisted a `step-start`-only message).
 * `UChatMessages` only skips messages with empty `parts`, so these would
 * otherwise render as an empty frame.
 */
function withoutEmptyAssistantMessages(messages: UIMessage[]): UIMessage[] {
  const filtered = messages.filter(message =>
    message.role !== 'assistant' || hasVisibleParts(message.parts)
  )
  return filtered.length === messages.length ? messages : filtered
}

/** Keep the loading indicator until the assistant message has renderable content. */
export function resolveChatDisplayState(
  messages: UIMessage[],
  status: AgentChatStatus
): { displayStatus: AgentChatStatus, displayMessages: UIMessage[] } {
  if (status !== 'streaming') {
    return { displayStatus: status, displayMessages: withoutEmptyAssistantMessages(messages) }
  }

  const last = messages.at(-1)
  if (last?.role === 'assistant' && !hasVisibleParts(last.parts)) {
    return {
      displayStatus: 'submitted',
      displayMessages: withoutEmptyAssistantMessages(messages.slice(0, -1))
    }
  }

  return { displayStatus: status, displayMessages: withoutEmptyAssistantMessages(messages) }
}
