import { chatDetailCacheKey } from './useChatDetailCache'
import { resolveChatRouteId } from './useChatRouteId'

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

  async function refresh() {
    const chatIdValue = id.value

    if (!loggedIn.value || !chatIdValue) {
      data.value = null
      error.value = null
      status.value = 'success'
      return
    }

    const cached = readCache(chatIdValue)
    if (cached) {
      data.value = cached
      error.value = null
      status.value = 'success'
      return
    }

    status.value = 'pending'
    error.value = null

    try {
      data.value = await $fetch<ChatDetail>(`/api/chats/${chatIdValue}`)
      status.value = 'success'
    } catch (err) {
      data.value = null
      error.value = err as Error
      status.value = 'error'
    }
  }

  watch([id, loggedIn], () => {
    void refresh()
  }, { immediate: true })

  return { data, error, status, refresh }
}
