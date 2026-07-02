import type { UIMessage } from 'ai'
import type { ChatEveState } from '../../shared/types/chat'
import { consumeFreshChat, uiMessagesToRows } from './useChatDetailCache'
import { useAgentChat, type UseAgentChatOptions } from './useAgentChat'

export interface UseAgentChatSessionOptions extends UseAgentChatOptions {
  data?: Ref<ChatDetail | null | undefined>
  dataStatus?: Ref<string>
  isOwner?: Ref<boolean>
  consumePendingPrompt?: () => string | null
  consumePendingMessageParts?: () => UIMessage['parts'] | null
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}

function needsGeneration(messages: ChatMessageRow[]) {
  const last = messages[messages.length - 1]
  return last?.role === 'user'
}

export function chatDetailForResume(
  chatId: string,
  initialMessages: UIMessage[] | undefined,
  initialState: ChatEveState | null | undefined,
  fetched?: ChatDetail | null
): ChatDetail | undefined {
  if (fetched) return fetched
  if (!initialMessages?.length) return undefined

  const rows: ChatMessageRow[] = uiMessagesToRows(initialMessages)

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

export function setupStaleChatRefresh(options: {
  chatId: string
  data: Ref<ChatDetail | null | undefined>
  status: Ref<string>
  refresh: () => Promise<void>
}) {
  onMounted(() => {
    if (consumeFreshChat(options.chatId)) return

    const cached = options.data.value
    if (!cached || options.status.value !== 'success') return

    const looksIncomplete = needsGeneration(cached.messages)
    if (looksIncomplete) void options.refresh()
  })
}

function resumeChatSession(options: {
  chat: ReturnType<typeof useAgentChat>['chat']
  send: ReturnType<typeof useAgentChat>['send']
  hasAgentUser: ReturnType<typeof useAgentChat>['hasAgentUser']
  data: Ref<ChatDetail | null | undefined>
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
      void options.send({ parts: lastUserMessage.parts as UIMessage['parts'], persist: false })
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
    toValue(options.initialMessages),
    toValue(options.initialState),
    options.data?.value
  ))

  const session = useAgentChat(options)

  const isOwner = options.isOwner ?? computed(() => loggedIn.value)
  const resumeDone = ref(false)

  watch(
    [() => options.data?.value, () => options.dataStatus?.value, loggedIn],
    () => {
      if (resumeDone.value) return
      if (loggedIn.value && options.dataStatus?.value === 'pending') return

      resumeDone.value = true
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
    },
    { immediate: true }
  )

  return session
}
