import { chatDetailCacheKey } from './useChatDetailCache'

export function useChatDetail(chatId: MaybeRefOrGetter<string>) {
  const { loggedIn } = useUserSession()
  const nuxtApp = useNuxtApp()
  const id = computed(() => toValue(chatId))

  return useLazyAsyncData(
    () => chatDetailCacheKey(id.value),
    () => {
      if (!loggedIn.value) return Promise.resolve(null)
      return $fetch<ChatDetail>(`/api/chats/${id.value}`)
    },
    {
      server: false,
      watch: [id, loggedIn],
      getCachedData: key => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    }
  )
}
