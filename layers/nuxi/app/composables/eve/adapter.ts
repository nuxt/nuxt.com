import type { DynamicToolUIPart, UIMessage } from 'ai'
import type { EveMessage, EveMessagePart, EveToolPart } from 'eve/vue'
import { expandAttachmentParts } from '../../../shared/utils/paste-attachment'
import type { AgentChatStatus } from './types'

function toolPartToUIPart(part: EveToolPart): DynamicToolUIPart {
  const base = { type: 'dynamic-tool' as const, toolCallId: part.callId, toolName: part.name }

  switch (part.state) {
    case 'streaming':
      return { ...base, state: 'input-streaming', input: undefined }
    case 'completed':
      return { ...base, state: 'output-available', input: part.input, output: part.output }
    case 'failed':
    case 'cancelled':
      return { ...base, state: 'output-error', input: part.input, errorText: part.error?.message ?? `Tool call ${part.state}` }
    case 'rejected':
      return { ...base, state: 'output-denied', input: part.input, approval: { id: part.interaction?.interactionId ?? part.callId, approved: false } }
    default:
      // Generator tools stream preliminary output while the call is still running.
      return part.output !== undefined
        ? { ...base, state: 'output-available', input: part.input, output: part.output, preliminary: true }
        : { ...base, state: 'input-available', input: part.input }
  }
}

/** Interaction parts (sign-ins, budget prompts) have no UI here and are dropped. */
function eveToUIParts(parts: readonly EveMessagePart[]): UIMessage['parts'] {
  return parts.flatMap((part): UIMessage['parts'] => {
    if (part.type === 'tool') return [toolPartToUIPart(part)]
    if (part.type === 'interaction') return []
    return [part as UIMessage['parts'][number]]
  })
}

/**
 * Eve derives assistant ids from turn ids (`turn_N:assistant`), which restart
 * for every session. They are persisted as DB rows, so prefix them with the
 * session id to keep them unique across the sessions of a chat.
 */
export function eveMessagesToUIMessages(messages: readonly EveMessage[], sessionId?: string): UIMessage[] {
  return messages.map((message) => {
    const parts = eveToUIParts(message.parts)
    if (message.role === 'user') {
      return { id: message.id, role: message.role, metadata: message.metadata, parts: expandAttachmentParts(parts) }
    }
    return {
      id: sessionId ? `${sessionId}:${message.id}` : message.id,
      role: message.role,
      metadata: message.metadata,
      parts
    }
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
