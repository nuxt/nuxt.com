import { LazyChatModalConfirm, LazyChatModalRename } from '#components'
import { isToday, isYesterday, subWeeks, subMonths } from 'date-fns'
import { chatDetailCacheKey } from './useChatDetailCache'

function groupChats(chats: UIChat[] | undefined | null) {
  const today: UIChat[] = []
  const yesterday: UIChat[] = []
  const lastWeek: UIChat[] = []
  const lastMonth: UIChat[] = []
  const older: Record<string, UIChat[]> = {}

  const oneWeekAgo = subWeeks(new Date(), 1)
  const oneMonthAgo = subMonths(new Date(), 1)

  chats?.forEach((chat) => {
    const chatDate = chat.updatedAt ? new Date(chat.updatedAt) : new Date(chat.createdAt)

    if (isToday(chatDate)) today.push(chat)
    else if (isYesterday(chatDate)) yesterday.push(chat)
    else if (chatDate >= oneWeekAgo) lastWeek.push(chat)
    else if (chatDate >= oneMonthAgo) lastMonth.push(chat)
    else {
      const monthYear = chatDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!older[monthYear]) older[monthYear] = []
      older[monthYear].push(chat)
    }
  })

  const sortedMonthYears = Object.keys(older).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const formattedGroups: Array<{ id: string, label: string, items: UIChat[] }> = []
  if (today.length) formattedGroups.push({ id: 'today', label: 'Today', items: today })
  if (yesterday.length) formattedGroups.push({ id: 'yesterday', label: 'Yesterday', items: yesterday })
  if (lastWeek.length) formattedGroups.push({ id: 'last-week', label: 'Last week', items: lastWeek })
  if (lastMonth.length) formattedGroups.push({ id: 'last-month', label: 'Last month', items: lastMonth })

  sortedMonthYears.forEach((monthYear) => {
    if (older[monthYear]?.length) {
      formattedGroups.push({ id: monthYear, label: monthYear, items: older[monthYear] })
    }
  })

  return formattedGroups
}

export function useChats() {
  const route = useRoute()
  const toast = useToast()
  const overlay = useOverlay()

  const { data: chatList } = useFetch<ChatListItem[]>('/api/chats', {
    key: 'chats',
    server: false,
    lazy: true,
    immediate: false,
    default: () => []
  })

  const uiChats = computed<UIChat[]>(() => chatList.value?.map(chat => ({
    id: chat.id,
    label: chat.title || 'Untitled',
    to: `/dashboard/chat/${chat.id}`,
    icon: 'i-lucide-message-circle',
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  })) ?? [])

  const groups = computed(() => groupChats(uiChats.value))

  function patchTitle(id: string, title: string) {
    if (chatList.value) {
      chatList.value = chatList.value.map(c => c.id === id ? { ...c, title } : c)
    }
    const { data: chatCache } = useNuxtData<ChatDetail>(chatDetailCacheKey(id))
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

  const renameModal = overlay.create(LazyChatModalRename)
  const deleteModal = overlay.create(LazyChatModalConfirm, {
    props: {
      title: 'Delete chat',
      description: 'Are you sure you want to delete this chat? This cannot be undone.',
      color: 'error'
    }
  })

  async function renameChat(id: string, currentTitle?: string | null): Promise<string | null> {
    const instance = renameModal.open({ title: currentTitle ?? '' })
    const result = (await instance.result) as string | false | undefined

    if (!result || result === currentTitle) return null

    try {
      await $fetch(`/api/chats/${id}/title`, {
        method: 'PATCH',
        body: { title: result }
      })
      patchTitle(id, result)
      return result
    } catch {
      toast.add({
        description: 'Failed to rename chat',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return null
    }
  }

  async function deleteChat(id: string): Promise<boolean> {
    const instance = deleteModal.open()
    const result = (await instance.result) as boolean

    if (!result) return false

    try {
      await $fetch(`/api/chats/${id}`, { method: 'DELETE' })
      toast.add({
        title: 'Chat deleted',
        description: 'Your chat has been deleted',
        icon: 'i-lucide-trash'
      })
      removeChat(id)
      if (route.params.id === id) {
        navigateTo('/dashboard/chat')
      }
      return true
    } catch {
      toast.add({
        description: 'Failed to delete chat',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return false
    }
  }

  return {
    chatList,
    uiChats,
    groups,
    patchTitle,
    removeChat,
    refresh,
    renameChat,
    deleteChat
  }
}
