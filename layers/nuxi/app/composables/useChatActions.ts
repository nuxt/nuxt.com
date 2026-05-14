import { LazyChatModalConfirm, LazyChatModalRename } from '#components'

export function useChatActions() {
  const route = useRoute()
  const toast = useToast()
  const overlay = useOverlay()
  const chats = useChatsData()

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
      chats.patchTitle(id, result)
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
      chats.removeChat(id)
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

  return { renameChat, deleteChat }
}
