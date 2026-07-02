import type { UIMessage } from 'ai'

const navigationChatKey = 'nuxi-navigation-chat-id'

export function setNavigationChatId(chatId: string) {
  if (!import.meta.client) return
  sessionStorage.setItem(navigationChatKey, chatId)
}

export function readNavigationChatId() {
  if (!import.meta.client) return ''
  return sessionStorage.getItem(navigationChatKey) ?? ''
}

export function clearNavigationChatId() {
  if (!import.meta.client) return
  sessionStorage.removeItem(navigationChatKey)
}

export function chatDetailCacheKey(chatId: string) {
  if (!chatId) return 'chat-pending'
  return `chat-${chatId}`
}

export function uiMessagesToRows(messages: UIMessage[]): ChatMessageRow[] {
  return messages.map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts,
    createdAt: (message.metadata as { createdAt?: string } | undefined)?.createdAt ?? new Date().toISOString()
  }))
}

export function seedChatDetailCache(chatId: string, detail: ChatDetail) {
  if (!import.meta.client) return

  const nuxtApp = useNuxtApp()
  const key = chatDetailCacheKey(chatId)
  nuxtApp.payload.data[key] = detail

  const { data } = useNuxtData<ChatDetail>(key)
  data.value = detail
}

export function patchChatDetailCache(
  chatId: string,
  patch: Partial<Pick<ChatDetail, 'title' | 'state' | 'messages'>>
) {
  if (!import.meta.client) return

  const key = chatDetailCacheKey(chatId)
  const { data } = useNuxtData<ChatDetail>(key)
  if (!data.value) return

  data.value = { ...data.value, ...patch }

  const nuxtApp = useNuxtApp()
  nuxtApp.payload.data[key] = data.value
}

const freshChatKey = (chatId: string) => `nuxi-fresh-chat:${chatId}`

export function markChatAsFresh(chatId: string) {
  if (!import.meta.client) return
  sessionStorage.setItem(freshChatKey(chatId), '1')
}

export function consumeFreshChat(chatId: string) {
  if (!import.meta.client) return false
  const key = freshChatKey(chatId)
  if (!sessionStorage.getItem(key)) return false
  sessionStorage.removeItem(key)
  return true
}
