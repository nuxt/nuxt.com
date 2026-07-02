import type { UIMessage } from 'ai'
import type { ChatEveState } from '../../shared/types/chat'
import { useAgentChat, type UseAgentChatOptions } from './useAgentChat'

export interface UseAgentChatSessionOptions extends UseAgentChatOptions {
  data?: Ref<ChatDetail | undefined>
  isOwner?: Ref<boolean>
  consumePendingPrompt?: () => string | null
  consumePendingMessageParts?: () => UIMessage['parts'] | null
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}

function needsGeneration(messages: ChatMessageRow[]) {
  const hasAssistant = messages.some(message => message.role === 'assistant')
  if (hasAssistant) return false
  return messages.some(message => message.role === 'user')
}

export function chatDetailForResume(
  chatId: string,
  initialMessages: UIMessage[] | undefined,
  initialState: ChatEveState | null | undefined,
  fetched?: ChatDetail
): ChatDetail | undefined {
  if (fetched) return fetched
  if (!initialMessages?.length) return undefined

  const rows: ChatMessageRow[] = initialMessages.map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts,
    createdAt: (message.metadata as { createdAt?: string } | undefined)?.createdAt ?? new Date().toISOString()
  }))

  if (!needsGeneration(rows)) return undefined

  return {
    id: chatId,
    title: null,
    visibility: 'private',
    isOwner: true,
    createdAt: new Date().toISOString(),
    state: initialState ?? null,
    messages: rows
  }
}

export async function refreshChatIfIncomplete(chatId: string, data: Ref<ChatDetail | undefined>) {
  const cached = data.value
  const looksIncomplete = cached?.messages.some(message => message.role === 'user')
    && !cached?.messages.some(message => message.role === 'assistant')
  if (looksIncomplete) {
    await refreshNuxtData(`chat-${chatId}`)
  }
}

function resumeChatSession(options: {
  chat: ReturnType<typeof useAgentChat>['chat']
  send: ReturnType<typeof useAgentChat>['send']
  hasAgentUser: ReturnType<typeof useAgentChat>['hasAgentUser']
  data: Ref<ChatDetail | undefined>
  loggedIn: Ref<boolean>
  isOwner: Ref<boolean>
  consumePendingPrompt: () => string | null
  consumePendingMessageParts: () => UIMessage['parts'] | null
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}) {
  if (!options.loggedIn.value) {
    const pendingParts = options.consumePendingMessageParts()
    const pendingPrompt = options.consumePendingPrompt()

    if (!pendingParts && !pendingPrompt) {
      options.redirectIfAnonymousEmpty?.()
      return
    }

    if (pendingParts) {
      options.onAnonymousTitle?.(pendingParts)
      void options.send({ parts: pendingParts })
      return
    }

    if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
    return
  }

  const messages = options.data.value?.messages ?? []

  if (options.isOwner.value && needsGeneration(messages)) {
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')
    if (!lastUserMessage) return

    if (options.hasAgentUser()) {
      void options.chat.regenerate()
    } else {
      void options.send({ parts: lastUserMessage.parts as UIMessage['parts'] })
    }
    return
  }

  const pendingParts = options.consumePendingMessageParts()
  if (pendingParts) {
    void options.send({ parts: pendingParts })
    return
  }

  const pendingPrompt = options.consumePendingPrompt()
  if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
}

export function useAgentChatSession(options: UseAgentChatSessionOptions) {
  const { loggedIn } = useUserSession()

  const resumeData = computed(() => chatDetailForResume(
    options.chatId,
    options.initialMessages,
    options.initialState,
    options.data?.value
  ))

  const session = useAgentChat(options)

  const isOwner = options.isOwner ?? computed(() => loggedIn.value)

  onMounted(() => {
    resumeChatSession({
      chat: session.chat,
      send: session.send,
      hasAgentUser: session.hasAgentUser,
      data: options.data ?? resumeData,
      loggedIn,
      isOwner,
      consumePendingPrompt: options.consumePendingPrompt ?? (() => null),
      consumePendingMessageParts: options.consumePendingMessageParts ?? (() => null),
      onAnonymousTitle: options.onAnonymousTitle,
      redirectIfAnonymousEmpty: options.redirectIfAnonymousEmpty
    })
  })

  return session
}
