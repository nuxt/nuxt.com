import type { UIMessage } from 'ai'
import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import type { FaqCategory, FaqQuestions } from '~/types/assistant'

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

export const useAssistant = createSharedComposable(() => {
  const appConfig = useAppConfig()
  const assistantConfig = appConfig.assistant as { faqQuestions?: FaqQuestions } | undefined

  const storageOpen = useLocalStorage('assistant-open', false)
  const messages = useLocalStorage<UIMessage[]>('assistant-messages', [])

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
    const faqConfig = assistantConfig?.faqQuestions
    if (!faqConfig) return []
    return normalizeFaqQuestions(faqConfig)
  })

  function open(initialMessage?: string, clearPrevious = false) {
    if (clearPrevious) {
      messages.value = []
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

  return {
    isOpen,
    messages,
    faqQuestions,
    open,
    close,
    toggle,
    expandToFullScreen,
    collapseToSidebar
  }
})
