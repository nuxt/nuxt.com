<script setup lang="ts">
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

const popoverOpen = ref(false)
const search = ref('')
const PAGE_SIZE = 7

const allChats = computed(() => chatList.value ?? [])

const filteredChats = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allChats.value.slice(0, PAGE_SIZE)
  return allChats.value
    .filter(c => (c.title || 'Untitled').toLowerCase().includes(q))
    .slice(0, PAGE_SIZE)
})

const hasMore = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allChats.value.length > PAGE_SIZE
  return allChats.value.filter(c => (c.title || 'Untitled').toLowerCase().includes(q)).length > PAGE_SIZE
})

function select(id: string) {
  panel?.setActiveChat(id)
  popoverOpen.value = false
  search.value = ''
}

watch(popoverOpen, (open) => {
  if (!open) search.value = ''
})
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

  <UPopover
    v-else
    v-model:open="popoverOpen"
    :content="{ align: 'start', side: 'bottom' }"
    :ui="{ content: 'w-72 p-0 overflow-hidden' }"
  >
    <UButton
      :label="activeChat ? (activeChat.title || 'Untitled') : 'New chat'"
      trailing-icon="i-lucide-chevrons-up-down"
      color="neutral"
      variant="ghost"
      class="font-medium max-w-44"
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

    <template #content>
      <div class="p-1.5 border-b border-default">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search chats…"
          variant="none"
          autofocus
          class="w-full"
        />
      </div>

      <div v-if="filteredChats.length" class="flex flex-col py-1">
        <button
          v-for="chat in filteredChats"
          :key="chat.id"
          type="button"
          class="group flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-left rounded-md mx-1 hover:bg-elevated transition-colors"
          :class="chat.id === panel?.chatId.value ? 'text-primary' : 'text-default'"
          @click="select(chat.id)"
        >
          <span class="truncate min-w-0">{{ chat.title || 'Untitled' }}</span>
          <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <UIcon
              v-if="chat.id === panel?.chatId.value"
              name="i-lucide-check"
              class="size-3.5 text-primary opacity-100"
            />
            <NuxtLink
              :to="`/dashboard/chat/${chat.id}`"
              class="p-0.5 rounded hover:bg-muted"
              :title="`Open in full screen`"
              @click.stop="isOpen = false"
            >
              <UIcon name="i-lucide-maximize-2" class="size-3.5 text-muted" />
            </NuxtLink>
          </div>
        </button>

        <p v-if="hasMore" class="px-3.5 py-1.5 text-xs text-muted">
          +{{ allChats.length - PAGE_SIZE }} more — use search to filter
        </p>
      </div>

      <div v-else class="px-3 py-4 text-center text-sm text-muted">
        No chats found
      </div>
    </template>
  </UPopover>
</template>
