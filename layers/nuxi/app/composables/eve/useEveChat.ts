import type { EveAgentReducer, EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import { defaultMessageReducer, useEveAgent } from 'eve/vue'
import type { FileUIPart, UIMessage } from 'ai'
import { eveMessagesToUIMessages } from './adapter'
import type { AgentChatHandle } from './types'

export interface UseEveChatOptions {
  initialMessages?: MaybeRefOrGetter<UIMessage[] | undefined>
  /** Read once at store creation — must be resolved before calling this composable. */
  sessionCursor?: ChatSessionCursor | null
  headers?: () => Record<string, string>
  /** Resolved before every turn — ephemeral, never persisted to session history. */
  clientContext?: () => string | undefined
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
    await agent.send([
      { type: 'text', text },
      ...fileParts.map(part => ({
        type: 'file' as const,
        data: part.url,
        mediaType: part.mediaType,
        filename: part.filename
      }))
    ])
    return
  }

  if (fileParts.length) {
    await agent.send(fileParts.map(part => ({
      type: 'file' as const,
      data: part.url,
      mediaType: part.mediaType,
      filename: part.filename
    })))
    return
  }

  if (text) {
    await agent.send(text)
  }
}

export function useEveChat(options: UseEveChatOptions): AgentChatHandle & {
  send: (input: string | { parts: UIMessage['parts'] }) => Promise<void>
  hasAgentMessage: (role: UIMessage['role']) => boolean
} {
  const agent = useEveAgent({
    // `initialSession` attaches to an existing Eve session, so it is only set
    // once a cursor has been persisted. The cursor makes the first send attach
    // at the stream tail — without it, the client replays the whole session
    // event log (duplicated turns). A fresh chat leaves it undefined so Eve
    // creates the session and reports its id back through `onFinish`.
    initialSession: options.sessionCursor ?? undefined,
    reducer: scopedTurnIdReducer(),
    headers: options.headers,
    // Page context belongs to the turn it was sent with, not to the thread —
    // `clientContext` reaches the model for that call only and never lands in
    // durable history, so a stale path can't leak into a later answer.
    prepareSend: (input) => {
      const clientContext = options.clientContext?.()
      return clientContext ? { ...input, clientContext } : input
    },
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
    if (agent.status.value !== 'submitted' && agent.status.value !== 'streaming') return

    // `cancel()` durably cancels the server-side turn and keeps the stream
    // attached until it settles — no separate client abort needed.
    void agent.cancel().catch(() => {})
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
      // Eve's `resuming` (checking an attached session for continuation) has no
      // `AgentChatStatus` equivalent — surface it as busy until the check settles.
      const status = agent.status.value
      return status === 'resuming' ? 'submitted' : status
    },
    get error() {
      return agent.error.value
    },
    stop,
    regenerate
  }
}
