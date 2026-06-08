import type { UIMessage } from 'ai'

interface AgentUsage {
  used: number
  remaining: number
  limit: number
}

function normalizeFaqQuestions(questions: FaqQuestions): FaqCategory[] {
  if (!questions || (Array.isArray(questions) && questions.length === 0)) return []
  if (typeof questions[0] === 'string') {
    return [{ category: 'Questions', items: questions as string[] }]
  }
  return questions as FaqCategory[]
}

const CONTEXT_PAGE_PREFIXES = ['/docs/', '/blog/', '/changelog/', '/modules/', '/deploy/']
const CONTEXT_INDEX_PAGES = new Set(['/docs', '/blog', '/changelog', '/modules', '/deploy'])
const AGENT_DISABLED_ROUTES = new Set(['/login'])

export const useNuxtAgent = createSharedComposable(() => {
  const appConfig = useAppConfig()
  const agentConfig = appConfig.agent as { faqQuestions?: FaqQuestions } | undefined
  const route = useRoute()
  const { loggedIn } = useUserSession()

  const storageOpen = useLocalStorage('assistant-open', false)
  const isOpen = ref(false)

  const isAgentEnabled = computed(() => !AGENT_DISABLED_ROUTES.has(route.path))

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
      if (isAgentEnabled.value) {
        isOpen.value = storageOpen.value
      }
    })
  })
  watch(isOpen, (value) => {
    if (isAgentEnabled.value) {
      storageOpen.value = value
    }
  })

  watch(() => route.path, (path) => {
    if (AGENT_DISABLED_ROUTES.has(path)) {
      isOpen.value = false
    }
  })

  const faqQuestions = computed<FaqCategory[]>(() => {
    const faqConfig = agentConfig?.faqQuestions
    if (!faqConfig) return []
    return normalizeFaqQuestions(faqConfig)
  })

  const pendingPrompt = ref<string | null>(null)
  const pendingMessageParts = ref<UIMessage['parts'] | null>(null)

  function consumePendingPrompt(): string | null {
    const value = pendingPrompt.value
    pendingPrompt.value = null
    return value
  }

  function consumePendingMessageParts(): UIMessage['parts'] | null {
    const value = pendingMessageParts.value
    pendingMessageParts.value = null
    return value
  }

  function open(initialMessage?: string) {
    if (!isAgentEnabled.value) return
    if (initialMessage) pendingPrompt.value = initialMessage
    isOpen.value = true
  }
  function toggle() {
    if (!isAgentEnabled.value) return
    isOpen.value = !isOpen.value
  }
  function expandToFullScreen() {
    isOpen.value = false
    navigateTo('/dashboard/chat')
  }
  function collapseToSidebar() {
    if (!isAgentEnabled.value) return
    isOpen.value = true
  }

  const isAgentDockedBreakpoint = useMediaQuery('(min-width: 1280px)')
  const isAgentDocked = computed(() => isOpen.value && isAgentDockedBreakpoint.value)

  const { data: usage } = useFetch<AgentUsage>('/api/agent/usage', {
    server: false,
    lazy: true,
    default: () => ({ used: 0, remaining: 20, limit: 20 })
  })
  const rateLimitReached = computed(() => (usage.value?.remaining ?? Infinity) <= 0)
  function onMessageSent() {
    if (!usage.value) return
    usage.value = {
      ...usage.value,
      used: usage.value.used + 1,
      remaining: Math.max(0, usage.value.remaining - 1)
    }
  }

  const { chatList, refresh: refreshChats } = useChatsData()

  watch(loggedIn, (next) => {
    if (next) refreshChats()
    else if (chatList.value) chatList.value = []
  })

  watch(isOpen, (next) => {
    if (next && loggedIn.value && !chatList.value?.length) refreshChats()
  })

  const nuxiMood = ref<NuxiMood>('idle')

  return {
    isOpen,
    isAgentEnabled,
    open,
    toggle,
    expandToFullScreen,
    collapseToSidebar,
    consumePendingPrompt,
    consumePendingMessageParts,
    pendingPrompt,
    pendingMessageParts,
    isAgentDockedBreakpoint,
    isAgentDocked,
    usage,
    rateLimitReached,
    onMessageSent,
    currentPage,
    pageContextDismissed,
    pageContextEnabled,
    faqQuestions,
    chatList,
    nuxiMood
  }
})
