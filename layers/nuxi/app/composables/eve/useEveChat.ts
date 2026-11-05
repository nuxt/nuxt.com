import type { UseEveAgentStatus } from 'eve/vue'
import { activeTurn } from 'eve/events'
import { useEveAgent } from 'eve/vue'
import type { UIMessage } from 'ai'
import { toEveUserContent } from '../../../shared/utils/paste-attachment'
import { eveMessagesToUIMessages } from './adapter'
import type { AgentChatHandle, AgentChatStatus } from './types'

export interface UseEveChatOptions {
  initialMessages?: MaybeRefOrGetter<UIMessage[] | undefined>
  /** Read once at store creation — must be resolved before calling this composable. */
  sessionCursor?: ChatSessionCursor | null
  headers?: () => Record<string, string>
  /** Resolved before every turn — ephemeral, never persisted to session history. */
  clientContext?: () => string | undefined
  onFinish?: (result: EveChatFinish) => void | Promise<void>
}

export interface EveChatFinish {
  messages: UIMessage[]
  session?: ChatSessionCursor
}

function toChatStatus(status: UseEveAgentStatus, error: Error | undefined): AgentChatStatus {
  // `resuming` (catching up on an attached session) has no `AgentChatStatus`
  // equivalent — surface it as busy until the check settles.
  if (status === 'resuming') return 'submitted'
  if (status === 'busy') return 'streaming'
  return error ? 'error' : 'ready'
}

async function sendUserParts(
  agent: ReturnType<typeof useEveAgent>,
  parts: UIMessage['parts']
) {
  const content = toEveUserContent(parts)
  if (content) await agent.send(content)
}

export function useEveChat(options: UseEveChatOptions): AgentChatHandle & {
  send: (input: string | { parts: UIMessage['parts'] }) => Promise<void>
  hasAgentMessage: (role: UIMessage['role']) => boolean
} {
  const agent = useEveAgent({
    // `initialSession` attaches to an existing Eve session, so it is only set
    // once a cursor has been persisted. A fresh chat leaves it undefined so Eve
    // creates the session and reports its id back through `onFinish`.
    initialSession: options.sessionCursor ?? undefined,
    headers: options.headers,
    // Page context belongs to the turn it was sent with, not to the thread —
    // `clientContext` reaches the model for that call only and never lands in
    // durable history, so a stale path can't leak into a later answer.
    prepareSend: (input) => {
      const clientContext = options.clientContext?.()
      return clientContext ? { ...input, clientContext } : input
    },
    onFinish: (snapshot) => {
      const sessionId = snapshot.session?.sessionId
      void options.onFinish?.({
        messages: eveMessagesToUIMessages(snapshot.messages.filter(isLive), sessionId),
        session: snapshot.session && { sessionId: snapshot.session.sessionId, streamIndex: snapshot.session.streamIndex }
      })
    }
  })

  // A saved cursor alone doesn't move where the stream opens, so the first send
  // replays the session from line 0 and its earlier turns, which the seed
  // already holds, would render twice. Hide every turn seen before the cursor.
  const cursor = options.sessionCursor
  const replayedTurnIds = computed(() => {
    const ids = new Set<string>()
    if (!cursor) return ids
    for (const event of agent.events.value) {
      if (event.meta.position.line >= cursor.streamIndex) break
      const turnId = event.scope?.turnId ?? (event.data as { turnId?: unknown } | undefined)?.turnId
      if (typeof turnId === 'string') ids.add(turnId)
    }
    return ids
  })

  function isLive(message: { metadata?: { turnId?: string } }) {
    const turnId = message.metadata?.turnId
    return !turnId || !replayedTurnIds.value.has(turnId)
  }

  const liveMessages = computed(() =>
    eveMessagesToUIMessages(agent.messages.value.filter(isLive), agent.session.value?.sessionId)
  )

  const seedMessages = computed(() => toValue(options.initialMessages) ?? [])

  const messages = computed(() => {
    const live = liveMessages.value
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
    if (agent.status.value !== 'idle') return
    // On a freshly mounted chat the live projection is empty — fall back to the seed.
    const isPrompt = (m: UIMessage) => m.role === 'user' && m.parts.length > 0
    const message = liveMessages.value.findLast(isPrompt) ?? seedMessages.value.findLast(isPrompt)
    if (!message) return
    await sendUserParts(agent, message.parts)
  }

  function stop() {
    if (agent.status.value !== 'busy' && !activeTurn(agent.view.value)) return

    // `cancel()` durably cancels the server-side turn and keeps the stream
    // attached until it settles — no separate client abort needed. Before the
    // turn has started it waits for the pending send's turn and cancels that.
    void agent.cancel().catch(() => {})
  }

  function hasAgentMessage(role: UIMessage['role']) {
    return liveMessages.value.some(message => message.role === role)
  }

  return {
    send,
    hasAgentMessage,
    get messages() {
      return messages.value
    },
    get status() {
      return toChatStatus(agent.status.value, agent.error.value)
    },
    get error() {
      return agent.error.value
    },
    stop,
    regenerate
  }
}
