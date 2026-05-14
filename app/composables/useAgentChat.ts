import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'

interface UseAgentChatOptions {
  /**
   * Switching chats requires remounting the consumer with a different `chatId`
   * (via `:key`), NOT mutating the same Chat instance — `AbstractChat` carries
   * internal state (status, error, jobExecutor queue, activeResponse) that
   * bleeds across conversations otherwise.
   */
  chatId: string
  initialMessages?: UIMessage[]
  initialVotes?: Map<string, boolean>
  source: string
  withPageContext?: 'always' | 'when-enabled'
  onFinish?: () => void
}

export const AGENT_CHAT_THEME = {
  prose: {
    p: { base: 'my-2 text-sm/6' },
    li: { base: 'my-0.5 text-sm/6' },
    ul: { base: 'my-2' },
    ol: { base: 'my-2' },
    h1: { base: 'text-xl mb-4' },
    h2: { base: 'text-lg mt-6 mb-3' },
    h3: { base: 'text-base mt-4 mb-2' },
    h4: { base: 'text-sm mt-3 mb-1.5' },
    code: { base: 'text-xs' },
    pre: { root: 'my-2', base: 'text-xs/5' },
    table: { root: 'my-2' },
    hr: { base: 'my-4' }
  }
} as const

export function useAgentChat(options: UseAgentChatOptions) {
  const agent = useNuxtAgent()
  const chats = useChatsData()
  const { track } = useAnalytics()
  const toast = useToast()

  const input = ref('')
  const votes = ref<Map<string, boolean>>(new Map(options.initialVotes))

  const useContext = computed(() =>
    options.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const chat = new Chat<UIMessage>({
    id: options.chatId,
    messages: options.initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chats/${options.chatId}`,
      headers: () => {
        if (useContext.value && agent.currentPage.value) {
          return { 'x-page-path': agent.currentPage.value }
        }
        return {}
      }
    }),
    onFinish: () => {
      options.onFinish?.()
    },
    onData: async (part) => {
      if (part.type === 'data-chat-title') {
        await chats.refresh()
        const updated = chats.chatList.value?.find(c => c.id === options.chatId)
        if (updated?.title) chats.patchTitle(options.chatId, updated.title)
      }
    }
  })

  function vote(message: UIMessage, isUpvoted: boolean) {
    const current = votes.value.get(message.id)
    const next = current === isUpvoted ? undefined : isUpvoted

    if (next === undefined) votes.value.delete(message.id)
    else votes.value.set(message.id, next)
    votes.value = new Map(votes.value)

    $fetch(`/api/chats/${options.chatId}/votes`, {
      method: 'POST',
      body: next === undefined
        ? { messageId: message.id }
        : { messageId: message.id, isUpvoted: next }
    }).catch(() => {
      if (current !== undefined) votes.value.set(message.id, current)
      else votes.value.delete(message.id)
      votes.value = new Map(votes.value)
      toast.add({ description: 'Failed to save vote', icon: 'i-lucide-alert-circle', color: 'error' })
    })
  }

  async function send(text: string) {
    if (!text.trim() || agent.rateLimitReached.value) return
    track('Nuxi Message Sent', {
      source: options.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: text.length
    })
    try {
      await chat.sendMessage({
        text,
        metadata: useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : undefined
      })
      agent.onMessageSent()
    } catch {
      // surfaced via chat.error
    }
  }

  async function onSubmit() {
    const raw = input.value
    input.value = ''
    await send(raw)
  }

  function askQuestion(question: string) {
    track('Nuxi FAQ Clicked', { question, source: options.source })
    send(question)
  }

  const canClear = computed(() => chat.messages.length > 0)

  return {
    chat,
    input,
    votes,
    vote,
    send,
    canClear,
    onSubmit,
    askQuestion,
    chatTheme: AGENT_CHAT_THEME
  }
}
