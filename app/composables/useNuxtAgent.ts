import type { UIMessage } from 'ai'
import { createSharedComposable, useLocalStorage, useMediaQuery, useSessionStorage } from '@vueuse/core'
import type { FaqCategory, FaqQuestions } from '~/types/agent'

interface AgentUsage {
  used: number
  remaining: number
  limit: number
}

function normalizeFaqQuestions(questions: FaqQuestions): FaqCategory[] {
  if (!questions || (Array.isArray(questions) && questions.length === 0)) {
    return []
  }

  if (typeof questions[0] === 'string') {
    return [{
      category: 'Questions',
      items: questions as string[]
    }]
  }

  return questions as FaqCategory[]
}

export const useNuxtAgent = createSharedComposable(() => {
  const appConfig = useAppConfig()
  const agentConfig = appConfig.agent as { faqQuestions?: FaqQuestions } | undefined

  const storageOpen = useLocalStorage('assistant-open', false)
  const messages = useSessionStorage<UIMessage[]>('assistant-messages', [])
  const chatId = useSessionStorage('assistant-chat-id', () => crypto.randomUUID())

  const isOpen = ref(false)

  onNuxtReady(() => {
    nextTick(() => {
      isOpen.value = storageOpen.value
    })
  })

  watch(isOpen, (value) => {
    storageOpen.value = value
  })

  const faqQuestions = computed<FaqCategory[]>(() => {
    const faqConfig = agentConfig?.faqQuestions
    if (!faqConfig) return []
    return normalizeFaqQuestions(faqConfig)
  })

  function resetChatId() {
    chatId.value = crypto.randomUUID()
  }

  function open(initialMessage?: string, clearPrevious = false) {
    if (clearPrevious) {
      messages.value = []
      resetChatId()
    }

    if (initialMessage) {
      messages.value = [...messages.value, {
        id: String(Date.now()),
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: initialMessage }]
      }]
    }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function expandToFullScreen() {
    isOpen.value = false
    navigateTo('/chat')
  }

  function collapseToSidebar() {
    isOpen.value = true
  }

  /** Matches Tailwind `xl` — docked USidebar only at this width and above */
  const isAgentDockedBreakpoint = useMediaQuery('(min-width: 1280px)')

  const isAgentDocked = computed(() => isOpen.value && isAgentDockedBreakpoint.value)

  const { data: usage, refresh: refreshUsage } = useFetch<AgentUsage>('/api/agent/usage', {
    server: false,
    lazy: true,
    default: () => ({ used: 0, remaining: 20, limit: 20 })
  })

  const rateLimitReached = computed(() => usage.value.remaining <= 0)

  function onMessageSent() {
    if (usage.value) {
      usage.value = {
        ...usage.value,
        used: usage.value.used + 1,
        remaining: Math.max(0, usage.value.remaining - 1)
      }
    }
  }

  return {
    isOpen,
    messages,
    chatId,
    resetChatId,
    faqQuestions,
    open,
    close,
    toggle,
    expandToFullScreen,
    collapseToSidebar,
    isAgentDockedBreakpoint,
    isAgentDocked,
    usage,
    rateLimitReached,
    refreshUsage,
    onMessageSent
  }
})
