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

  return useLazyAsyncData(
    () => chatDetailCacheKey(id.value),
    () => {
      if (!id.value || !loggedIn.value) return Promise.resolve(null)
      return $fetch<ChatDetail>(`/api/chats/${id.value}`)
    },
    {
      server: false,
      watch: [id, loggedIn],
      getCachedData: key => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    }
  )
}
