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

export function uiMessagesToRows(
  messages: UIMessage[],
  existing?: ChatMessageRow[]
): ChatMessageRow[] {
  const existingById = new Map(existing?.map(row => [row.id, row.createdAt]))

  return messages.map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts,
    createdAt: (message.metadata as { createdAt?: string } | undefined)?.createdAt
      ?? existingById.get(message.id)
      ?? new Date().toISOString()
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

  let resolved = patch
  if (patch.messages?.length && data.value.messages?.length) {
    const existingById = new Map(data.value.messages.map(row => [row.id, row.createdAt]))
    resolved = {
      ...patch,
      messages: patch.messages.map(row => ({
        ...row,
        createdAt: existingById.get(row.id) ?? row.createdAt
      }))
    }
  }

  data.value = { ...data.value, ...resolved }

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

export function resolveChatRouteId(path: string, param: string | string[] | undefined) {
  if (typeof param === 'string' && param) return param
  if (Array.isArray(param) && param[0]) return param[0]

  const match = path.match(/^\/dashboard\/chat\/([^/]+)\/?$/)
  if (match?.[1]) return match[1]

  return readNavigationChatId()
}

export function useChatRouteId() {
  const route = useRoute()
  return computed(() => resolveChatRouteId(route.path, route.params.id))
}

export function useChatDetail(chatId: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const { loggedIn } = useUserSession()
  const nuxtApp = useNuxtApp()

  const id = computed(() => {
    const value = toValue(chatId)
    if (value) return value
    return resolveChatRouteId(route.path, route.params.id)
  })

  return useLazyAsyncData(
    () => chatDetailCacheKey(id.value),
    () => {
      if (!id.value || !loggedIn.value) return Promise.resolve(null)
      return $fetch<ChatDetail>(`/api/chats/${id.value}`)
    },
    {
      watch: [id, loggedIn],
      getCachedData: key => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    }
  )
}
