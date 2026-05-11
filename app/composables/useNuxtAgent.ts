import { createSharedComposable, useLocalStorage, useMediaQuery } from '@vueuse/core'
import type { FaqCategory, FaqQuestions } from '~/types/agent'

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

/**
 * Shared UI state for the floating agent panel (open/close, page-context
 * detection, daily-usage limit, FAQ list, shared chat list).
 *
 * Every chat surface — the slideover panel AND the `/chat/[id]` page — owns
 * its own `chatId` locally and creates its own `Chat` instance scoped to it.
 * Switching between chats in the UI navigates to `/chat/[id]` (just like the
 * `nuxt-ui-templates/chat` template), which mounts a fresh page → fresh
 * `Chat` instance. No session/local storage involved.
 */
export const useNuxtAgent = createSharedComposable(() => {
  const appConfig = useAppConfig()
  const agentConfig = appConfig.agent as { faqQuestions?: FaqQuestions } | undefined
  const route = useRoute()
  const { loggedIn } = useUserSession()

  const storageOpen = useLocalStorage('assistant-open', false)
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

  /** A prompt the next mounted chat surface should auto-submit. */
  const pendingPrompt = ref<string | null>(null)
  function consumePendingPrompt(): string | null {
    const value = pendingPrompt.value
    pendingPrompt.value = null
    return value
  }

  function open(initialMessage?: string) {
    if (initialMessage) pendingPrompt.value = initialMessage
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
    if (!usage.value) return
    usage.value = {
      ...usage.value,
      used: usage.value.used + 1,
      remaining: Math.max(0, usage.value.remaining - 1)
    }
  }

  // Shared chat list (logged-in only). Sidebar + switcher dropdown read from
  // here so we don't double-fetch.
  const { data: chatList, refresh: refreshChatList } = useFetch<ChatListItem[]>('/api/chats', {
    key: 'chats',
    default: () => [],
    server: false,
    lazy: true,
    immediate: false
  })

  onMounted(() => {
    if (loggedIn.value && (!chatList.value || chatList.value.length === 0)) {
      refreshChatList()
    }
  })
  watch(loggedIn, (next) => {
    if (next) refreshChatList()
    else chatList.value = []
  })

  return {
    isOpen,
    open,
    toggle,
    expandToFullScreen,
    collapseToSidebar,
    consumePendingPrompt,
    pendingPrompt,
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
    refreshChatList
  }
})
