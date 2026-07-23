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

/**
 * Merge a patch into the cached chat detail. Messages are merged by id:
 * known rows are updated in place (keeping their createdAt), new rows are
 * appended — history is append-only.
 */
export function patchChatDetailCache(
  chatId: string,
  patch: { title?: string | null, messages?: ChatMessageRow[], sessionCursor?: ChatSessionCursor | null }
) {
  if (!import.meta.client) return

  const key = chatDetailCacheKey(chatId)
  const { data } = useNuxtData<ChatDetail>(key)
  if (!data.value) return

  let messages = data.value.messages ?? []
  if (patch.messages?.length) {
    const indexById = new Map(messages.map((row, index) => [row.id, index]))
    messages = [...messages]
    for (const row of patch.messages) {
      const index = indexById.get(row.id)
      if (index === undefined) {
        messages.push(row)
      } else {
        messages[index] = { ...row, createdAt: messages[index]!.createdAt }
      }
    }
  }

  data.value = { ...data.value, ...patch, messages }

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

  const data = ref<ChatDetail | null>(null)
  const error = ref<Error | null>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')

  function readCache(chatIdValue: string) {
    const key = chatDetailCacheKey(chatIdValue)
    return (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as ChatDetail | undefined
  }

  let inflight: { id: string, promise: Promise<void> } | null = null

  async function fetchDetail(chatIdValue: string) {
    try {
      const detail = await $fetch<ChatDetail>(`/api/chats/${chatIdValue}`)
      // Seed the shared cache: without this, only created/streamed chats were
      // cached, so navigating back to a fetched chat refetched it every time —
      // data went null, the `isOwner` gate unmounted the whole chat body, and
      // the page flashed blank until the response arrived.
      nuxtApp.payload.data[chatDetailCacheKey(chatIdValue)] = detail
      data.value = detail
      status.value = 'success'
    } catch (err) {
      data.value = null
      error.value = err as Error
      status.value = 'error'
    }
  }

  function refresh(options?: { force?: boolean }): Promise<void> {
    const chatIdValue = id.value

    if (!loggedIn.value || !chatIdValue) {
      data.value = null
      error.value = null
      status.value = 'success'
      return Promise.resolve()
    }

    if (!options?.force) {
      const cached = readCache(chatIdValue)
      if (cached) {
        data.value = cached
        error.value = null
        status.value = 'success'
        return Promise.resolve()
      }
      // Awaiting `refresh()` while the immediate watcher's fetch is in flight
      // must join it, not start a second request.
      if (inflight?.id === chatIdValue) return inflight.promise
    }

    status.value = 'pending'
    error.value = null

    const promise = fetchDetail(chatIdValue).finally(() => {
      if (inflight?.promise === promise) inflight = null
    })
    inflight = { id: chatIdValue, promise }
    return promise
  }

  watch([id, loggedIn], () => {
    void refresh()
  }, { immediate: true })

  return { data, error, status, refresh }
}
