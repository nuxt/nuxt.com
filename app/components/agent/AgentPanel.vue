<script setup lang="ts">
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'

const { isOpen, messages, chatId, resetChatId, faqQuestions, expandToFullScreen, isAgentDockedBreakpoint, usage, rateLimitReached, onMessageSent } = useNuxtAgent()
const { track } = useAnalytics()
const route = useRoute()
const toast = useToast()
const input = ref('')
const votes = ref(new Map<string, boolean>())

function vote(message: UIMessage, isUpvoted: boolean) {
  const current = votes.value.get(message.id)
  const next = current === isUpvoted ? undefined : isUpvoted

  if (next === undefined) {
    votes.value.delete(message.id)
  } else {
    votes.value.set(message.id, next)
  }
  votes.value = new Map(votes.value)

  $fetch('/api/agent/vote', {
    method: 'POST',
    body: { chatId: chatId.value, messageId: message.id, isUpvoted: next }
  }).catch(() => {
    if (current !== undefined) votes.value.set(message.id, current)
    else votes.value.delete(message.id)
    votes.value = new Map(votes.value)
  })
}

const indexPages = new Set(['/docs', '/blog', '/changelog', '/modules', '/deploy'])

const currentPage = computed(() => {
  const path = route.path
  if (indexPages.has(path)) return null
  if (!path.startsWith('/docs/') && !path.startsWith('/blog/') && !path.startsWith('/changelog/') && !path.startsWith('/modules/') && !path.startsWith('/deploy/')) return null
  return path
})

const pageContextAdded = ref(false)
const pageContextDismissed = ref(false)

watch(currentPage, () => {
  pageContextAdded.value = false
  pageContextDismissed.value = false
})

const showPageContext = computed(() => currentPage.value && (pageContextAdded.value || !pageContextDismissed.value))

let _skipSync = false

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/agent',
    headers: () => ({ 'x-chat-id': chatId.value })
  }),
  onError: (error: Error) => {
    let message = error.message
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message
      } catch {
        // keep original on malformed JSON
      }
    }

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  },
  onFinish: () => {
    _skipSync = true
    messages.value = chat.messages
    nextTick(() => {
      _skipSync = false
    })
  }
})

watch(messages, (newMessages) => {
  if (_skipSync) return

  chat.messages = newMessages
  if (chat.lastMessage?.role === 'user') {
    chat.regenerate()
  }
})

const canClear = computed(() => messages.value.length > 0 || chat.messages.length > 0)

async function onSubmit() {
  if (!input.value.trim() || rateLimitReached.value) return

  const raw = input.value
  track('Nuxt Agent Message Sent', {
    source: 'prompt',
    page: currentPage.value,
    withContext: showPageContext.value,
    queryLength: raw.length
  })
  const text = currentPage.value && showPageContext.value
    ? `[Page: ${currentPage.value}] ${raw}`
    : raw
  input.value = ''
  try {
    await chat.sendMessage({ text })
    onMessageSent()
  } catch {
    // Error surfaced via chat.onError
  }
}

function askQuestion(question: string) {
  track('Nuxt Agent FAQ Clicked', { question })
  input.value = question
  onSubmit()
}

function clearMessages() {
  track('Nuxt Agent Chat Cleared')
  if (chat.status === 'streaming') {
    chat.stop()
  }
  messages.value = []
  chat.messages = []
  resetChatId()
  votes.value = new Map()
}

const panelUi = {
  footer: 'p-0',
  actions: 'gap-0.5'
} as const

/* Slideover theme defaults add sm:px-6 / sm:p-6; override so layout matches USidebar (full width inside panel) */
const slideoverUi = {
  footer: 'p-0 px-0 sm:px-0',
  header:
    'min-h-(--ui-header-height) flex items-center gap-1.5 overflow-hidden border-b border-default px-4 sm:px-4',
  wrapper: 'min-w-0 flex-1',
  title: 'text-highlighted font-semibold truncate',
  actions: 'flex items-center gap-1.5 shrink-0 gap-0.5',
  close: '',
  body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-4'
}

defineShortcuts({
  meta_i: {
    handler: () => {
      isOpen.value = !isOpen.value
    },
    usingInput: true
  },
  tab: {
    handler: () => {
      if (!currentPage.value) return
      if (showPageContext.value) {
        pageContextAdded.value = false
        pageContextDismissed.value = true
      } else {
        pageContextAdded.value = true
        pageContextDismissed.value = false
      }
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
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>
    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          @click="clearMessages"
        />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          @click="expandToFullScreen"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="isOpen = false"
        />
      </UTooltip>
    </template>

    <AgentPanelMain
      v-model:votes="votes"
      :chat="chat"
      :faq-questions="faqQuestions"
      @ask-question="askQuestion"
      @vote="vote"
    />

    <template #footer>
      <AgentPanelFooter
        v-model="input"
        :chat="chat"
        :current-page="currentPage"
        :show-page-context="!!showPageContext"
        :rate-limit-reached="rateLimitReached"
        :usage="usage"
        @submit="onSubmit"
        @dismiss-page-context="pageContextAdded = false; pageContextDismissed = true"
        @add-page-context="pageContextAdded = true; pageContextDismissed = false"
      />
    </template>
  </USidebar>

  <USlideover
    v-else
    v-model:open="isOpen"
    side="right"
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{
      ...slideoverUi,
      /* Full width on small screens; cap at sidebar width from sm up (slideover only below xl) */
      content: 'w-full max-w-none sm:max-w-96 max-h-svh p-0 flex flex-col'
    }"
  >
    <template #title>
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>
    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          @click="clearMessages"
        />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          @click="expandToFullScreen"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="isOpen = false"
        />
      </UTooltip>
    </template>

    <template #body>
      <AgentPanelMain
        v-model:votes="votes"
        :chat="chat"
        :faq-questions="faqQuestions"
        class="min-h-0 flex-1 flex flex-col overflow-hidden"
        @ask-question="askQuestion"
        @vote="vote"
      />
    </template>

    <template #footer>
      <AgentPanelFooter
        v-model="input"
        :chat="chat"
        :current-page="currentPage"
        :show-page-context="!!showPageContext"
        :rate-limit-reached="rateLimitReached"
        :usage="usage"
        @submit="onSubmit"
        @dismiss-page-context="pageContextAdded = false; pageContextDismissed = true"
        @add-page-context="pageContextAdded = true; pageContextDismissed = false"
      />
    </template>
  </USlideover>
</template>
