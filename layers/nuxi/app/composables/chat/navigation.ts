import type { UIMessage } from 'ai'
import { buildMessageParts, getMessageTextLength } from '../../../shared/utils/paste-attachment'
import { createPromptBindings } from './prompt-bindings'
import { usePasteAttachment } from './usePasteAttachment'

export function useChatNavigation(source: string) {
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
    prompt: createPromptBindings(paste, onSubmit),
    onSubmit,
    createFromSuggestion
  }
}
