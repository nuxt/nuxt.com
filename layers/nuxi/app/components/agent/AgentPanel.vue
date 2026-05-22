<script setup lang="ts">
import type { UIMessage } from 'ai'
import { motion } from 'motion-v'

const {
  isOpen,
  isAgentDockedBreakpoint,
  currentPage,
  pageContextDismissed,
  pendingPrompt,
  nuxiMood
} = useNuxtAgent()
const { chatList } = useChatsData()
const { loggedIn } = useUserSession()

// The active chat id and its messages must always be paired — otherwise
// `<AgentPanelChat :key="chatId" :initial-messages>` could remount with the
// new id but the previous chat's messages (or vice-versa) when the two refs
// update on different micro-ticks. Group them in a single shallowRef so the
// swap is atomic.
type ActiveChat = { id: string, messages: UIMessage[] }
const active = shallowRef<ActiveChat>({ id: crypto.randomUUID(), messages: [] })
const chatId = computed(() => active.value.id)
const initialMessages = computed(() => active.value.messages)
let loadToken = 0

function startNewChat() {
  loadToken++
  active.value = { id: crypto.randomUUID(), messages: [] }
}

async function setActiveChat(id: string) {
  if (id === active.value.id) return
  const token = ++loadToken
  try {
    const data = await $fetch<ChatDetail>(`/api/chats/${id}`)
    if (token !== loadToken) return
    const messages = (data.messages ?? []).map(m => ({
      id: m.id,
      role: m.role,
      parts: m.parts as UIMessage['parts'],
      metadata: { createdAt: m.createdAt }
    }))
    active.value = { id, messages }
  } catch {
    if (token === loadToken) {
      active.value = { id: crypto.randomUUID(), messages: [] }
    }
  }
}

function openFullScreen() {
  isOpen.value = false
  const id = active.value.id
  const isPersisted = chatList.value?.some(c => c.id === id)
  navigateTo(isPersisted ? `/dashboard/chat/${id}` : '/dashboard/chat')
}

provide<{
  chatId: Ref<string>
  startNewChat: () => void
  setActiveChat: (id: string) => Promise<void>
}>('agent-panel', { chatId, startNewChat, setActiveChat })

watch(pendingPrompt, (prompt) => {
  if (prompt) startNewChat()
})

const panelUi = {
  body: 'p-0 gap-0 overflow-hidden',
  actions: 'gap-0.5'
} as const

const slideoverUi = {
  body: 'p-0 sm:p-0 gap-0 overflow-hidden',
  header: 'min-h-(--ui-header-height) flex items-center gap-1.5 overflow-hidden border-b border-default px-4 sm:px-4',
  wrapper: 'min-w-0 flex-1',
  title: 'text-highlighted font-semibold truncate',
  actions: 'flex items-center gap-1.5 shrink-0 gap-0.5',
  close: ''
}

defineShortcuts({
  meta_i: {
    handler: () => {
      isOpen.value = !isOpen.value
    },
    usingInput: true
  },
  meta_o: {
    handler: () => {
      if (!isOpen.value || !loggedIn.value) return
      startNewChat()
    },
    usingInput: true
  },
  tab: {
    handler: () => {
      if (!isOpen.value || !currentPage.value) return
      pageContextDismissed.value = !pageContextDismissed.value
    },
    usingInput: true
  }
})
</script>

<template>
  <USidebar
    v-if="isAgentDockedBreakpoint"
    v-model:open="isOpen"
    side="right"
    rail
    :style="{ '--sidebar-width': '24rem' }"
    :ui="panelUi"
  >
    <template #title>
      <AgentChatSwitcher v-if="loggedIn" class="min-w-0" />
      <span v-else class="inline-flex items-center gap-2 min-w-0">
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
    </template>

    <template #actions>
      <UTooltip text="New chat" :kbds="loggedIn ? ['meta', 'O'] : undefined">
        <UButton icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="New chat" @click="startNewChat" />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton icon="i-lucide-maximize" color="neutral" variant="ghost" @click="openFullScreen" />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="isOpen = false" />
      </UTooltip>
    </template>

    <AgentPanelChat :key="chatId" :chat-id="chatId" :initial-messages="initialMessages" />
  </USidebar>

  <USlideover
    v-else
    v-model:open="isOpen"
    side="right"
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{
      ...slideoverUi,
      content: 'w-full max-w-none sm:max-w-96 max-h-svh p-0 flex flex-col'
    }"
  >
    <template #title>
      <AgentChatSwitcher v-if="loggedIn" class="min-w-0" />
      <span v-else class="inline-flex items-center gap-2 min-w-0">
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
    </template>

    <template #actions>
      <UTooltip text="New chat" :kbds="loggedIn ? ['meta', 'O'] : undefined">
        <UButton icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="New chat" @click="startNewChat" />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton icon="i-lucide-maximize" color="neutral" variant="ghost" @click="openFullScreen" />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="isOpen = false" />
      </UTooltip>
    </template>

    <template #body>
      <AgentPanelChat :key="chatId" :chat-id="chatId" :initial-messages="initialMessages" />
    </template>
  </USlideover>
</template>
