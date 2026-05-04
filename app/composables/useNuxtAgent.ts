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

const CONTEXT_PAGE_PREFIXES = ['/docs/', '/blog/', '/changelog/', '/modules/', '/deploy/']
const CONTEXT_INDEX_PAGES = new Set(['/docs', '/blog', '/changelog', '/modules', '/deploy'])

export const useNuxtAgent = createSharedComposable(() => {
  const appConfig = useAppConfig()
  const agentConfig = appConfig.agent as { faqQuestions?: FaqQuestions } | undefined
  const route = useRoute()

  const storageOpen = useLocalStorage('assistant-open', false)
  const messages = useSessionStorage<UIMessage[]>('assistant-messages', [])
  const chatId = useSessionStorage('assistant-chat-id', () => crypto.randomUUID())

  const isOpen = ref(false)

  const currentPage = computed(() => {
    const path = route.path
    if (CONTEXT_INDEX_PAGES.has(path)) return null
    if (!CONTEXT_PAGE_PREFIXES.some(prefix => path.startsWith(prefix))) return null
    return path
  })

  const pageContextDismissed = ref(false)
  watch(currentPage, () => {
    pageContextDismissed.value = false
  })
  const pageContextEnabled = computed(() => Boolean(currentPage.value) && !pageContextDismissed.value)

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
        parts: [{ type: 'text' as const, text: initialMessage }],
        ...(currentPage.value ? { metadata: { pagePath: currentPage.value } } : {})
      }]
      onMessageSent()
    }
    isOpen.value = true
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

  const { data: usage } = useFetch<AgentUsage>('/api/agent/usage', {
    server: false,
    lazy: true,
    default: () => ({ used: 0, remaining: 20, limit: 20 })
  })

  const rateLimitReached = computed(() => (usage.value?.remaining ?? Infinity) <= 0)

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
    toggle,
    expandToFullScreen,
    collapseToSidebar,
    isAgentDockedBreakpoint,
    isAgentDocked,
    usage,
    rateLimitReached,
    onMessageSent,
    currentPage,
    pageContextDismissed,
    pageContextEnabled
  }
})
