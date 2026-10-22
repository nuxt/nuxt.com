import type { UIMessage } from 'ai'
import type { EveMessage } from 'eve/vue'
import { expandAttachmentParts } from '../../../shared/utils/paste-attachment'
import type { AgentChatStatus } from './types'

export function eveMessagesToUIMessages(messages: readonly EveMessage[]): UIMessage[] {
  return (messages as readonly UIMessage[]).map((message) => {
    if (message.role !== 'user') return message
    const parts = expandAttachmentParts(message.parts)
    return parts === message.parts ? message : { ...message, parts }
  })
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

const SETTLED_TOOL_STATES = new Set(['output-available', 'output-error', 'output-denied'])

function isPartSettled(part: UIMessage['parts'][number]): boolean {
  if (part.type === 'text' || part.type === 'reasoning') return part.state !== 'streaming'
  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
    return SETTLED_TOOL_STATES.has((part as { state?: string }).state ?? '')
  }
  return true
}

/**
 * The turn is still running but every part of the reply has settled: the agent is between
 * steps (a tool result came back, the next model call has not streamed yet), and nothing on
 * screen is animating. A pending tool approval is not settled, so it never counts.
 */
export function isBetweenSteps(messages: UIMessage[], status: AgentChatStatus): boolean {
  if (status !== 'streaming') return false
  const last = messages.at(-1)
  if (last?.role !== 'assistant' || !hasVisibleParts(last.parts)) return false
  return normalizeEveParts(last.parts).every(isPartSettled)
}

/** Drop assistant messages without renderable content — they'd render as an empty frame. */
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
  // The stream can open before the assistant message exists; UChatMessages
  // hides its indicator for `streaming` unless the last message is an assistant.
  if (last?.role !== 'assistant') {
    return { displayStatus: 'submitted', displayMessages: withoutEmptyAssistantMessages(messages) }
  }

  if (!hasVisibleParts(last.parts)) {
    return {
      displayStatus: 'submitted',
      displayMessages: withoutEmptyAssistantMessages(messages.slice(0, -1))
    }
  }

  return { displayStatus: status, displayMessages: withoutEmptyAssistantMessages(messages) }
}
