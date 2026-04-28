import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'

interface UseAgentChatOptions {
  /** Telemetry source for `Nuxt Agent Message Sent` events. */
  source: string
  /** Whether to forward the current page as context (`x-page-path` header + metadata). */
  withPageContext?: 'always' | 'when-enabled'
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
  const {
    messages,
    chatId,
    resetChatId,
    currentPage,
    pageContextEnabled,
    rateLimitReached,
    onMessageSent
  } = useNuxtAgent()
  const { track } = useAnalytics()

  const input = ref('')
  const votes = ref(new Map<string, boolean>())

  const useContext = computed(() =>
    options.withPageContext === 'always'
      ? Boolean(currentPage.value)
      : pageContextEnabled.value && Boolean(currentPage.value)
  )

  let _skipSync = false

  const chat = new Chat({
    messages: messages.value,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      headers: () => {
        const headers: Record<string, string> = { 'x-chat-id': chatId.value }
        if (useContext.value && currentPage.value) headers['x-page-path'] = currentPage.value
        return headers
      }
    }),
    onFinish: () => {
      _skipSync = true
      messages.value = chat.messages
      nextTick(() => {
        _skipSync = false
      })
    }
  })

  watch(messages, (newMessages) => {
    if (_skipSync) return

    chat.messages = newMessages
    if (chat.lastMessage?.role === 'user') {
      chat.regenerate()
    }
  })

  const canClear = computed(() => messages.value.length > 0 || chat.messages.length > 0)

  function vote(message: UIMessage, isUpvoted: boolean) {
    const current = votes.value.get(message.id)
    const next = current === isUpvoted ? undefined : isUpvoted

    if (next === undefined) {
      votes.value.delete(message.id)
    } else {
      votes.value.set(message.id, next)
    }
    votes.value = new Map(votes.value)

    $fetch('/api/agent/vote', {
      method: 'POST',
      body: { chatId: chatId.value, messageId: message.id, isUpvoted: next }
    }).catch(() => {
      if (current !== undefined) votes.value.set(message.id, current)
      else votes.value.delete(message.id)
      votes.value = new Map(votes.value)
    })
  }

  async function onSubmit() {
    if (!input.value.trim() || rateLimitReached.value) return

    const raw = input.value
    track('Nuxt Agent Message Sent', {
      source: options.source,
      page: currentPage.value,
      withContext: useContext.value,
      queryLength: raw.length
    })
    input.value = ''
    try {
      await chat.sendMessage({
        text: raw,
        metadata: useContext.value && currentPage.value ? { pagePath: currentPage.value } : undefined
      })
      onMessageSent()
    } catch {
      // Error surfaced via chat.error
    }
  }

  function askQuestion(question: string) {
    track('Nuxt Agent FAQ Clicked', { question, source: options.source })
    input.value = question
    onSubmit()
  }

  function clearMessages() {
    track('Nuxt Agent Chat Cleared', { source: options.source })
    if (chat.status === 'streaming') {
      chat.stop()
    }
    messages.value = []
    chat.messages = []
    resetChatId()
    votes.value = new Map()
  }

  return {
    chat,
    input,
    votes,
    vote,
    canClear,
    onSubmit,
    askQuestion,
    clearMessages,
    chatTheme: AGENT_CHAT_THEME
  }
}
