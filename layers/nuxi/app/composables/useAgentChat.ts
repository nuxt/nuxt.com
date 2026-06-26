import type { UIMessage } from 'ai'
import type { ChatEveState } from '../../shared/types/chat'
import { buildMessageParts, getMessageTextLength } from '../../shared/utils/paste-attachment'
import { createEveChatSession } from './eve/session'
import { getOrCreateEveAgent, removeEveAgent } from './eve/init'
import { toUIMessages } from './eve/adapter'
import {
  createEveFinishHandler,
  readAnonymousTitle,
  resumeOptionsFromChat
} from './eve/thread-state'
import { useChatVotes } from './useChatVotes'
import { usePasteAttachment } from './usePasteAttachment'

type ChatModeOptions = {
  mode?: 'chat'
  chatId: string
  initialMessages?: UIMessage[]
  initialState?: ChatEveState | null
  persistedInDb?: boolean
  source: string
  withPageContext?: 'always' | 'when-enabled'
  fetchVotes?: boolean
  onFinish?: () => void
  onTitle?: (title: string) => void
}

type StartModeOptions = {
  mode: 'start'
  source: string
}

export type UseAgentChatOptions = ChatModeOptions | StartModeOptions

function buildEveHeaders(
  chatId: string,
  agent: ReturnType<typeof useNuxtAgent>,
  withPageContext: ComputedRef<boolean>
) {
  return () => {
    const headers: Record<string, string> = {
      'x-nuxi-chat-id': chatId
    }

    if (withPageContext.value && agent.currentPage.value) {
      headers['x-page-path'] = agent.currentPage.value
    }

    return headers
  }
}

type StartChatReturn = {
  input: Ref<string>
  loading: Ref<boolean>
  prompt: ReturnType<ReturnType<typeof usePasteAttachment>['bindings']>
  onSubmit: () => Promise<void>
  createFromSuggestion: (label: string) => Promise<void>
}

type AgentChatReturn = {
  chat: {
    messages: UIMessage[]
    status: 'ready' | 'submitted' | 'streaming' | 'error'
    error?: Error
    stop: () => void
    regenerate: () => Promise<void>
  }
  input: Ref<string>
  prompt: ReturnType<ReturnType<typeof usePasteAttachment>['bindings']>
  getVote: (messageId: string) => boolean | null
  vote: (message: UIMessage, isUpvoted: boolean) => void
  send: (inputValue: string | { parts: UIMessage['parts'] }) => Promise<void>
  onSubmit: () => Promise<void>
  askQuestion: (question: string) => void
  readAnonymousTitle: () => string | null
}

function useStartChat(source: string): StartChatReturn {
  const agent = useNuxtAgent()
  const chats = useChats()
  const { loggedIn } = useUserSession()
  const { track } = useAnalytics()
  const toast = useToast()

  const input = ref('')
  const paste = usePasteAttachment(input)
  const loading = ref(false)

  async function createChat(parts: UIMessage['parts']) {
    if (loading.value || agent.rateLimitReached.value || getMessageTextLength(parts) === 0) return
    loading.value = true

    try {
      if (loggedIn.value) {
        const chatId = crypto.randomUUID()
        await createChatWithMessage(chatId, parts)
        await chats.refresh()
        await navigateTo(`/dashboard/chat/${chatId}`)
      } else {
        agent.pendingMessageParts.value = parts
        await navigateTo(`/dashboard/chat/${crypto.randomUUID()}`)
      }
    } catch {
      toast.add({ description: 'Failed to create chat', icon: 'i-lucide-alert-circle', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function onSubmit() {
    if (!paste.canSubmit.value) return
    const parts = paste.buildMessageParts()
    paste.clearAttachments()
    input.value = ''
    track('Nuxi Message Sent', { source, queryLength: getMessageTextLength(parts) })
    await createChat(parts)
  }

  function createFromSuggestion(label: string) {
    track('Nuxi FAQ Clicked', { question: label, source })
    return createChat(buildMessageParts(label, []))
  }

  return {
    input,
    loading,
    prompt: paste.bindings(onSubmit),
    onSubmit,
    createFromSuggestion
  }
}

export function useAgentChat<T extends UseAgentChatOptions>(
  options: T
): T extends StartModeOptions ? StartChatReturn : AgentChatReturn
export function useAgentChat(options: UseAgentChatOptions) {
  if (options.mode === 'start') {
    return useStartChat(options.source)
  }

  const chatOptions = options
  const agent = useNuxtAgent()
  const chats = useChats()
  const { loggedIn } = useUserSession()
  const { track } = useAnalytics()

  const input = ref('')
  const paste = usePasteAttachment(input)
  const { getVote, vote } = useChatVotes(() => chatOptions.chatId, chatOptions.fetchVotes ?? false)

  const initialDbPersistDone = ref((chatOptions.initialMessages?.length ?? 0) > 0)

  const useContext = computed(() =>
    chatOptions.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const resumeOptions = computed(() => {
    if (chatOptions.initialState) {
      return resumeOptionsFromChat({ state: chatOptions.initialState })
    }
    return {}
  })

  const eveSession = createEveChatSession(() => chatOptions.chatId, () => ({
    ...resumeOptions.value,
    headers: buildEveHeaders(chatOptions.chatId, agent, useContext),
    onFinish: createEveFinishHandler({
      chatId: chatOptions.chatId,
      loggedIn: () => loggedIn.value,
      getMessages: () => toUIMessages(getOrCreateEveAgent(chatOptions.chatId).data.value.messages),
      refreshChats: () => chats.refresh(),
      patchTitle: (id, title) => chats.patchTitle(id, title),
      findChatTitle: id => chats.chatList.value?.find(c => c.id === id)?.title ?? null,
      onTitle: chatOptions.onTitle,
      onFinish: chatOptions.onFinish
    })
  }))

  const chat = {
    get messages() {
      const live = eveSession.messages
      if (live.length > 0) return live
      return chatOptions.initialMessages ?? []
    },
    get status() {
      return eveSession.status
    },
    get error() {
      return eveSession.error
    },
    stop: eveSession.stop,
    regenerate: eveSession.regenerate
  }

  async function persistFirstUserMessage(parts: UIMessage['parts']) {
    if (initialDbPersistDone.value) return
    initialDbPersistDone.value = true

    const metadata = {
      createdAt: new Date().toISOString(),
      ...(useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : {})
    }

    try {
      if (chatOptions.persistedInDb) {
        await appendUserMessageToChat(chatOptions.chatId, parts, metadata)
      } else {
        await createChatWithMessage(chatOptions.chatId, parts, metadata)
      }
    } catch (error) {
      initialDbPersistDone.value = false
      throw error
    }
  }

  type SendInput = string | { parts: UIMessage['parts'] }

  async function send(inputValue: SendInput) {
    const parts = typeof inputValue === 'string'
      ? [{ type: 'text' as const, text: inputValue }]
      : inputValue.parts

    if (!parts.length || getMessageTextLength(parts) === 0 || agent.rateLimitReached.value) return

    track('Nuxi Message Sent', {
      source: chatOptions.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: getMessageTextLength(parts)
    })

    if (loggedIn.value) {
      await persistFirstUserMessage(parts)
    }

    await eveSession.send(typeof inputValue === 'string' ? inputValue : { parts })
    agent.onMessageSent()
  }

  async function onSubmit() {
    if (!paste.canSubmit.value) return
    const parts = paste.buildMessageParts()
    input.value = ''
    paste.clearAttachments()
    await send({ parts })
  }

  function askQuestion(question: string) {
    track('Nuxi FAQ Clicked', { question, source: chatOptions.source })
    send(question)
  }

  if (import.meta.client) {
    onUnmounted(() => {
      removeEveAgent(chatOptions.chatId)
    })
  }

  return {
    chat,
    input,
    prompt: paste.bindings(onSubmit),
    getVote,
    vote,
    send,
    onSubmit,
    askQuestion,
    readAnonymousTitle: () => readAnonymousTitle(chatOptions.chatId)
  }
}
