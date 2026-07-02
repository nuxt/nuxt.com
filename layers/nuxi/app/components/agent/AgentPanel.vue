<script setup lang="ts">
import type { UIMessage } from 'ai'
import { motion } from 'motion-v'

const {
  isOpen,
  isAgentEnabled,
  isAgentDockedBreakpoint,
  currentPage,
  pageContextDismissed,
  pendingPrompt,
  nuxiMood
} = useNuxtAgent()
const { chatList } = useChats()
const { loggedIn } = useUserSession()

type ActiveChat = { id: string, messages: UIMessage[], state: ChatEveState | null }
const active = shallowRef<ActiveChat>({ id: crypto.randomUUID(), messages: [], state: null })
const chatId = computed(() => active.value.id)
const initialMessages = computed(() => active.value.messages)
const initialState = computed(() => active.value.state)
let loadToken = 0

function startNewChat() {
  loadToken++
  active.value = { id: crypto.randomUUID(), messages: [], state: null }
}

async function setActiveChat(id: string) {
  if (id === active.value.id) return
  const token = ++loadToken
  try {
    const data = await $fetch<ChatDetail>(`/api/chats/${id}`)
    if (token !== loadToken) return
    active.value = { id, messages: toUIMessages(data.messages ?? []), state: data.state ?? null }
  } catch {
    if (token === loadToken) {
      active.value = { id: crypto.randomUUID(), messages: [], state: null }
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

defineShortcuts({
  meta_i: {
    handler: () => {
      if (!isAgentEnabled.value) return
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
  <AgentPanelShell v-model:open="isOpen" :docked="isAgentDockedBreakpoint">
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

    <AgentPanelChat
      :key="chatId"
      :chat-id="chatId"
      :initial-messages="initialMessages"
      :initial-state="initialState"
    />
  </AgentPanelShell>
</template>
