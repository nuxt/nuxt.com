<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { chatList, refreshChatList, isOpen } = useNuxtAgent()
const { renameChat, deleteChat } = useChatActions()

const panel = inject<{
  chatId: Ref<string>
  startNewChat: () => void
  setActiveChat: (id: string) => void
}>('agent-panel')

const label = computed(() => {
  const active = chatList.value?.find(c => c.id === panel?.chatId.value)
  return active?.title || 'New chat'
})

async function handleRename(chat: ChatListItem) {
  if (await renameChat(chat.id, chat.title || '')) refreshChatList()
}

async function handleDelete(chat: ChatListItem) {
  if (!await deleteChat(chat.id)) return
  // If the deleted chat was the active one, drop into a fresh chat.
  if (chat.id === panel?.chatId.value) panel?.startNewChat()
  refreshChatList()
}

const items = computed<DropdownMenuItem[][]>(() => {
  const list = chatList.value ?? []
  const newAction: DropdownMenuItem = {
    label: 'New chat',
    icon: 'i-custom-new-chat',
    kbds: ['meta', 'O'],
    onSelect: () => panel?.startNewChat()
  }
  if (!list.length) return [[newAction]]
  return [
    [newAction],
    list.map<DropdownMenuItem>(chat => ({
      label: chat.title || 'New chat',
      icon: chat.id === panel?.chatId.value ? 'i-lucide-check' : 'i-lucide-message-circle',
      children: [[
        {
          label: 'Continue chat',
          icon: 'i-lucide-arrow-right',
          onSelect: () => panel?.setActiveChat(chat.id)
        },
        {
          label: 'Open in full screen',
          icon: 'i-lucide-maximize-2',
          to: `/chat/${chat.id}`,
          onSelect: () => (isOpen.value = false)
        }
      ], [
        { label: 'Rename', icon: 'i-lucide-pencil', onSelect: () => handleRename(chat) },
        { label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const, onSelect: () => handleDelete(chat) }
      ]]
    }))
  ]
})
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'w-56' }">
    <UButton
      :label="label"
      trailing-icon="i-lucide-chevrons-up-down"
      color="neutral"
      variant="ghost"
      class="font-medium max-w-40"
      :ui="{ label: 'truncate min-w-0' }"
    />
  </UDropdownMenu>
</template>
