import { LazyChatModalConfirm } from '#components'

export function useDeleteAccount() {
  const overlay = useOverlay()
  const toast = useToast()
  const { fetch: refreshSession } = useUserSession()

  const confirmModal = overlay.create(LazyChatModalConfirm, {
    props: {
      title: 'Delete account',
      description: 'This permanently deletes your nuxt.com account and your chats with Nuxi. This cannot be undone.',
      color: 'error',
      confirmLabel: 'Delete account'
    }
  })

  return async function deleteAccount() {
    if (!(await confirmModal.open().result)) return

    try {
      await $fetch('/api/account', { method: 'DELETE' })
    } catch {
      toast.add({
        description: 'Failed to delete account',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return
    }

    await refreshSession()
    toast.add({
      title: 'Account deleted',
      icon: 'i-lucide-trash'
    })
    await navigateTo('/')
  }
}
