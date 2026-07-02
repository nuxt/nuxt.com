import type { UIMessage } from 'ai'
import { buildMessageParts, getMessageTextLength } from '../../shared/utils/paste-attachment'
import { createChatWithMessage } from '../../shared/utils/chat'
import { markChatAsFresh, seedChatDetailCache } from './useChatDetailCache'
import { usePasteAttachment } from './usePasteAttachment'

export function useStartChat(source: string) {
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
        const detail = await createChatWithMessage(chatId, parts)
        seedChatDetailCache(chatId, detail)
        markChatAsFresh(chatId)
        await navigateTo(`/dashboard/chat/${chatId}`)
        void chats.refresh()
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
    prompt: paste.prompt,
    onSubmit,
    handlePaste: paste.handlePaste,
    removeAttachment: paste.removeAttachment,
    restoreToInput: paste.restoreToInput,
    createFromSuggestion
  }
}
