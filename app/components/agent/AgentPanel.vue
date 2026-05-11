<script setup lang="ts">
import type { UIMessage } from 'ai'

const {
  isOpen,
  expandToFullScreen,
  isAgentDockedBreakpoint,
  currentPage,
  pageContextDismissed,
  pendingPrompt,
  chatList
} = useNuxtAgent()
const { loggedIn } = useUserSession()

const chatId = ref<string>(crypto.randomUUID())
function startNewChat() {
  chatId.value = crypto.randomUUID()
}
function setActiveChat(id: string) {
  chatId.value = id
}
provide<{
  chatId: Ref<string>
  startNewChat: () => void
  setActiveChat: (id: string) => void
}>('agent-panel', { chatId, startNewChat, setActiveChat })

// `agent.open(message)` from the floating input or docs TOC always drops the
// prompt into a fresh conversation.
watch(pendingPrompt, (prompt) => {
  if (prompt) startNewChat()
})

// Load persisted messages when the panel is showing a known chat (one from
// `chatList`). For brand-new ephemeral ids we leave `chatData` null and the
// chat surface starts empty.
const chatData = ref<ChatDetail | null>(null)
let loadToken = 0
watch([chatId, chatList, loggedIn], async ([id, list, isLoggedIn]) => {
  const persisted = isLoggedIn && id && list?.some(c => c.id === id)
  if (!persisted) {
    chatData.value = null
    return
  }
  const token = ++loadToken
  try {
    const data = await $fetch<ChatDetail>(`/api/chats/${id}`)
    if (token === loadToken) chatData.value = data
  } catch {
    if (token === loadToken) chatData.value = null
  }
}, { immediate: true })

const initialMessages = computed<UIMessage[]>(() =>
  (chatData.value?.messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    parts: m.parts as UIMessage['parts']
  }))
)

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
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>

    <template #actions>
      <UTooltip text="New chat" :kbds="loggedIn ? ['meta', 'O'] : undefined">
        <UButton icon="i-custom-new-chat" color="neutral" variant="ghost" aria-label="New chat" @click="startNewChat" />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton icon="i-lucide-maximize-2" color="neutral" variant="ghost" @click="expandToFullScreen" />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton icon="i-lucide-panel-right-close" color="neutral" variant="ghost" aria-label="Close" @click="isOpen = false" />
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
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>

    <template #actions>
      <UTooltip text="New chat" :kbds="loggedIn ? ['meta', 'O'] : undefined">
        <UButton icon="i-custom-new-chat" color="neutral" variant="ghost" aria-label="New chat" @click="startNewChat" />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton icon="i-lucide-maximize-2" color="neutral" variant="ghost" @click="expandToFullScreen" />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton icon="i-lucide-panel-right-close" color="neutral" variant="ghost" aria-label="Close" @click="isOpen = false" />
      </UTooltip>
    </template>

    <template #body>
      <AgentPanelChat :key="chatId" :chat-id="chatId" :initial-messages="initialMessages" />
    </template>
  </USlideover>
</template>
