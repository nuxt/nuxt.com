export function useChatsData() {
  const { data: chatList } = useFetch<ChatListItem[]>('/api/chats', {
    key: 'chats',
    server: false,
    lazy: true,
    immediate: false,
    default: () => []
  })

  function patchTitle(id: string, title: string) {
    if (chatList.value) {
      chatList.value = chatList.value.map(c => c.id === id ? { ...c, title } : c)
    }
    const { data: chatCache } = useNuxtData<ChatDetail>(`chat-${id}`)
    if (chatCache.value) {
      chatCache.value = { ...chatCache.value, title }
    }
  }

  function removeChat(id: string) {
    if (chatList.value) {
      chatList.value = chatList.value.filter(c => c.id !== id)
    }
  }

  async function refresh() {
    await refreshNuxtData('chats')
  }

  return { chatList, patchTitle, removeChat, refresh }
}
