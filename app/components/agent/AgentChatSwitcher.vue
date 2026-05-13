<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { motion } from 'motion-v'

const { isOpen, nuxiMood } = useNuxtAgent()
const { chatList } = useChatsData()

const panel = inject<{
  chatId: Ref<string>
  startNewChat: () => void
  setActiveChat: (id: string) => void
}>('agent-panel')

const activeChat = computed(() => chatList.value?.find(c => c.id === panel?.chatId.value))
const hasChatHistory = computed(() => !!chatList.value?.length)

const items = computed<DropdownMenuItem[][]>(() => [
  (chatList.value ?? []).map<DropdownMenuItem>(chat => ({
    label: chat.title || 'Untitled',
    icon: chat.id === panel?.chatId.value ? 'i-lucide-check' : undefined,
    onSelect: () => panel?.setActiveChat(chat.id),
    suffix: chat.id === panel?.chatId.value
      ? undefined
      : {
          label: 'Open in full screen',
          icon: 'i-lucide-maximize-2',
          to: `/dashboard/chat/${chat.id}`,
          onSelect: () => (isOpen.value = false)
        }
  }))
])
</script>

<template>
  <span
    v-if="!hasChatHistory"
    class="inline-flex items-center gap-2 min-w-0"
  >
    <motion.span
      :initial="{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }"
      :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
      :transition="{ duration: 0.3, ease: 'easeOut', delay: 0.1 }"
      class="inline-flex"
    >
      <AgentNuxiIcon class="size-5 shrink-0" :mood="nuxiMood" />
    </motion.span>
    <span class="truncate">Nuxi</span>
    <UBadge variant="subtle" size="sm" class="shrink-0">
      Beta
    </UBadge>
  </span>

  <UDropdownMenu
    v-else
    :items="items"
    :ui="{ content: 'w-56' }"
    :content="{ align: 'start' }"
  >
    <UButton
      :label="activeChat ? (activeChat.title || 'Untitled') : 'New chat'"
      trailing-icon="i-lucide-chevrons-up-down"
      color="neutral"
      variant="ghost"
      class="font-medium max-w-40"
      :ui="{ label: 'truncate min-w-0' }"
    >
      <template #leading>
        <motion.span
          :initial="{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
          :transition="{ duration: 0.3, ease: 'easeOut', delay: 0.1 }"
          class="inline-flex"
        >
          <AgentNuxiIcon class="size-5 shrink-0" :mood="nuxiMood" />
        </motion.span>
      </template>
    </UButton>
  </UDropdownMenu>
</template>
