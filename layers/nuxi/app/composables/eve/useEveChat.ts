import type { EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import { useEveAgent } from 'eve/vue'
import type { FileUIPart, UIMessage } from 'ai'
import type { ChatEveState } from '../../../shared/types/chat'
import { eveMessagesToUIMessages } from './adapter'
import type { AgentChatHandle } from './types'

export interface UseEveChatOptions {
  chatId: MaybeRefOrGetter<string>
  initialMessages?: MaybeRefOrGetter<UIMessage[] | undefined>
  initialState?: MaybeRefOrGetter<ChatEveState | null | undefined>
  headers?: () => Record<string, string>
  onFinish?: (snapshot: UseEveAgentSnapshot<EveMessageData>) => void | Promise<void>
}

function mergeMessagesById(seed: UIMessage[], live: UIMessage[]): UIMessage[] {
  if (!live.length) return seed
  if (!seed.length) return live

  const liveById = new Map(live.map(message => [message.id, message]))
  const seedIds = new Set(seed.map(message => message.id))
  const merged = seed.map(message => liveById.get(message.id) ?? message)

  for (const message of live) {
    if (!seedIds.has(message.id)) merged.push(message)
  }

  return merged
}

function resumeFromState(chatId: string, state: ChatEveState | null | undefined) {
  const events = state?.events
  if (!events?.length) {
    return {
      initialSession: {
        continuationToken: chatId,
        streamIndex: 0
      }
    }
  }

  const session = state?.session ?? { streamIndex: 0 }

  return {
    initialSession: {
      ...session,
      continuationToken: session.continuationToken ?? chatId,
      streamIndex: Math.max(session.streamIndex ?? 0, events.length)
    },
    initialEvents: events as never
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
  // initialSession/initialEvents are read once at store creation (eve/vue); late-arriving
  // initialState cannot re-seed the agent — merged messages below keep history visible.
  const resume = resumeFromState(toValue(options.chatId), toValue(options.initialState))

  const agent = useEveAgent({
    ...resume,
    headers: options.headers,
    onFinish: (snapshot) => {
      void options.onFinish?.(snapshot)
    }
  })

  const seedMessages = computed(() => toValue(options.initialMessages) ?? [])

  const messages = computed(() => {
    const live = eveMessagesToUIMessages(agent.data.value.messages)
    return mergeMessagesById(seedMessages.value, live)
  })

  async function send(input: string | { parts: UIMessage['parts'] }) {
    const parts = typeof input === 'string'
      ? [{ type: 'text' as const, text: input }]
      : input.parts

    await sendUserParts(agent, parts)
  }

  async function regenerate() {
    if (agent.status.value === 'submitted' || agent.status.value === 'streaming') return
    const message = lastUserMessage(agent.data.value)
    if (!message) return
    await sendUserParts(agent, message.parts as UIMessage['parts'])
  }

  function stop() {
    agent.stop()
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
