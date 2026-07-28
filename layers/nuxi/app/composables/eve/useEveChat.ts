import type { EveAgentReducer, EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import { defaultMessageReducer, useEveAgent } from 'eve/vue'
import type { FileUIPart, UIMessage } from 'ai'
import { eveMessagesToUIMessages } from './adapter'
import type { AgentChatHandle } from './types'

export interface UseEveChatOptions {
  chatId: MaybeRefOrGetter<string>
  initialMessages?: MaybeRefOrGetter<UIMessage[] | undefined>
  /** Read once at store creation — must be resolved before calling this composable. */
  sessionCursor?: ChatSessionCursor | null
  headers?: () => Record<string, string>
  onFinish?: (snapshot: UseEveAgentSnapshot<EveMessageData>) => void | Promise<void>
}

/**
 * Eve turn ids (`turn_N`) restart at 0 for every session, and derived message
 * ids are persisted as DB rows — prefix them with a random scope regenerated
 * on each `session.started` to keep them unique across sessions.
 */
function scopedTurnIdReducer(): EveAgentReducer<EveMessageData> {
  const base = defaultMessageReducer()
  let scope = crypto.randomUUID().slice(0, 8)

  return {
    initial: () => base.initial(),
    reduce(data, event) {
      if (event.type === 'session.started') {
        scope = crypto.randomUUID().slice(0, 8)
      }

      const eventData = (event as { data?: { turnId?: unknown } }).data
      if (typeof eventData?.turnId === 'string' && eventData.turnId) {
        event = {
          ...event,
          data: { ...eventData, turnId: `${scope}:${eventData.turnId}` }
        } as typeof event
      }

      return base.reduce(data, event)
    }
  }
}

function lastUserMessage(data: EveMessageData) {
  for (let index = data.messages.length - 1; index >= 0; index -= 1) {
    const message = data.messages[index]
    if (message?.role === 'user' && message.parts.length > 0) {
      return message
    }
  }
}

async function sendUserParts(
  agent: ReturnType<typeof useEveAgent>,
  parts: UIMessage['parts']
) {
  const text = parts
    .filter((part): part is { type: 'text', text: string } => part.type === 'text')
    .map(part => part.text)
    .join('\n')
    .trim()

  const fileParts = parts.filter((part): part is FileUIPart => part.type === 'file')

  if (fileParts.length && text) {
    await agent.send({
      message: [
        { type: 'text', text },
        ...fileParts.map(part => ({
          type: 'file' as const,
          data: part.url,
          mediaType: part.mediaType,
          filename: part.filename
        }))
      ]
    })
    return
  }

  if (fileParts.length) {
    await agent.send({
      message: fileParts.map(part => ({
        type: 'file' as const,
        data: part.url,
        mediaType: part.mediaType,
        filename: part.filename
      }))
    })
    return
  }

  if (text) {
    await agent.send({ message: text })
  }
}

export function useEveChat(options: UseEveChatOptions): AgentChatHandle & {
  send: (input: string | { parts: UIMessage['parts'] }) => Promise<void>
  hasAgentMessage: (role: UIMessage['role']) => boolean
} {
  const agent = useEveAgent({
    // The chat id doubles as the Eve continuation token. The persisted cursor
    // makes the first send attach at the stream tail — without it, the client
    // replays the whole session event log (duplicated turns).
    initialSession: {
      continuationToken: toValue(options.chatId),
      streamIndex: 0,
      ...options.sessionCursor
    },
    reducer: scopedTurnIdReducer(),
    headers: options.headers,
    onFinish: (snapshot) => {
      void options.onFinish?.(snapshot)
    }
  })

  const seedMessages = computed(() => toValue(options.initialMessages) ?? [])

  const messages = computed(() => {
    const live = eveMessagesToUIMessages(agent.data.value.messages)
    if (!live.length) return seedMessages.value

    // Persisted history and the live projection are disjoint by construction;
    // the id filter only guards against a mid-visit refetch racing a sync.
    const liveIds = new Set(live.map(message => message.id))
    return [...seedMessages.value.filter(message => !liveIds.has(message.id)), ...live]
  })

  async function send(input: string | { parts: UIMessage['parts'] }) {
    const parts = typeof input === 'string'
      ? [{ type: 'text' as const, text: input }]
      : input.parts

    await sendUserParts(agent, parts)
  }

  async function regenerate() {
    if (agent.status.value === 'submitted' || agent.status.value === 'streaming') return
    // On a freshly mounted chat the live projection is empty — fall back to the seed.
    const message = lastUserMessage(agent.data.value)
      ?? [...seedMessages.value].reverse().find(m => m.role === 'user' && m.parts.length > 0)
    if (!message) return
    await sendUserParts(agent, message.parts as UIMessage['parts'])
  }

  function stop() {
    const { sessionId } = agent.session.value
    const wasActive = agent.status.value === 'submitted' || agent.status.value === 'streaming'

    agent.stop()

    // `agent.stop()` only aborts the client stream — best-effort cancel the
    // server-side turn too, or it keeps running to completion.
    if (wasActive && sessionId) {
      void $fetch(`/eve/v1/session/${encodeURIComponent(sessionId)}/cancel`, {
        method: 'POST',
        headers: options.headers?.()
      }).catch(() => {})
    }
  }

  function hasAgentMessage(role: UIMessage['role']) {
    return agent.data.value.messages.some(message => message.role === role)
  }

  return {
    send,
    hasAgentMessage,
    get messages() {
      return messages.value
    },
    get status() {
      return agent.status.value
    },
    get error() {
      return agent.error.value
    },
    stop,
    regenerate
  }
}
