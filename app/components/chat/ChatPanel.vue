<script setup lang="ts">
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'

const { messages, chatId, resetChatId, collapseToSidebar, usage, rateLimitReached, onMessageSent, currentPage } = useNuxtAgent()
const { track } = useAnalytics()
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

let _skipSync = false

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/agent',
    headers: () => {
      const headers: Record<string, string> = { 'x-chat-id': chatId.value }
      if (currentPage.value) headers['x-page-path'] = currentPage.value
      return headers
    }
  }),
  onError: (error: Error) => {
    let message = error.message
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message
      } catch {
        // keep original
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

const suggestions = [
  {
    icon: 'i-lucide-rocket',
    title: 'Start a project',
    description: 'Pick a starter template',
    question: 'Show me available starter templates'
  },
  {
    icon: 'i-lucide-lock',
    title: 'Add auth',
    description: 'User authentication setup',
    question: 'How do I add authentication to my Nuxt app?'
  },
  {
    icon: 'i-lucide-layers',
    title: 'Rendering',
    description: 'SSR, SSG, ISR & more',
    question: 'What are the available rendering modes in Nuxt?'
  },
  {
    icon: 'i-lucide-database',
    title: 'Database',
    description: 'Connect a database',
    question: 'How do I connect a database to my Nuxt app?'
  },
  {
    icon: 'i-lucide-cloud',
    title: 'Deploy',
    description: 'Ship to production',
    question: 'How do I deploy my Nuxt app?'
  },
  {
    icon: 'i-lucide-sparkles',
    title: 'What\'s new',
    description: 'Latest in Nuxt 4',
    question: 'What\'s new in Nuxt 4?'
  }
]

async function onSubmit() {
  if (!input.value.trim() || rateLimitReached.value) return

  const raw = input.value
  track('Nuxt Agent Message Sent', { source: 'chat-page', queryLength: raw.length })
  input.value = ''
  try {
    await chat.sendMessage({
      text: raw,
      metadata: currentPage.value ? { pagePath: currentPage.value } : undefined
    })
    onMessageSent()
  } catch {
    // Error surfaced via chat.onError
  }
}

function askQuestion(question: string) {
  track('Nuxt Agent FAQ Clicked', { question, source: 'chat-page' })
  input.value = question
  onSubmit()
}

function clearMessages() {
  track('Nuxt Agent Chat Cleared', { source: 'chat-page' })
  if (chat.status === 'streaming') {
    chat.stop()
  }
  messages.value = []
  chat.messages = []
  resetChatId()
  votes.value = new Map()
}

const chatTheme = {
  prose: {
    p: { base: 'my-2 text-sm/6' },
    li: { base: 'my-0.5 text-sm/6' },
    ul: { base: 'my-2' },
    ol: { base: 'my-2' },
    h1: { base: 'text-xl mb-4' },
    h2: { base: 'text-lg mt-6 mb-3' },
    h3: { base: 'text-base mt-4 mb-2' },
    h4: { base: 'text-sm mt-3 mb-1.5' },
    code: { base: 'text-xs' },
    pre: { root: 'my-2', base: 'text-xs/5' },
    table: { root: 'my-2' },
    hr: { base: 'my-4' }
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 relative">
    <div class="absolute top-0 inset-x-0 z-10 backdrop-blur pointer-events-none">
      <div class="flex items-center justify-between px-3 py-2 pointer-events-auto">
        <UTooltip text="Back to nuxt.com">
          <NuxtLink to="/" class="flex items-baseline gap-1.5 text-muted hover:text-highlighted transition-colors" @click="collapseToSidebar">
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            <NuxtLogo class="h-4.5 w-auto" />
          </NuxtLink>
        </UTooltip>

        <div class="flex items-center gap-1.5">
          <UTooltip v-if="canClear" text="New conversation">
            <UButton
              icon="i-lucide-list-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="clearMessages"
            />
          </UTooltip>
          <UColorModeButton size="sm" color="neutral" variant="ghost" />
        </div>
      </div>
    </div>

    <template v-if="!chat.messages.length">
      <div class="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <div class="flex w-full max-w-2xl flex-col items-center px-4">
          <div class="relative h-36 w-full shrink-0 overflow-hidden sm:h-40">
            <AgentShader variant="hero" />
          </div>
          <div class="text-center">
            <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted tracking-tight">
              What can I help you with?
            </h1>
            <p class="text-base text-muted mt-2 max-w-lg mx-auto">
              Ask anything or explore docs, modules, deployment, and more.
            </p>
          </div>
        </div>

        <div class="w-full max-w-2xl flex flex-col gap-6">
          <div v-if="rateLimitReached" class="flex items-center justify-center gap-2 py-4 text-sm text-muted">
            <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
            <span>Daily limit reached. Try again tomorrow.</span>
          </div>
          <UChatPrompt
            v-else
            v-model="input"
            :error="chat.error"
            placeholder="Ask anything…"
            variant="subtle"
            :rows="2"
            :maxrows="5"
            autofocus
            class="[view-transition-name:chat-prompt]"
            :ui="{ base: 'px-1.5 rounded-none' }"
            @submit="onSubmit"
          >
            <template #footer>
              <UTooltip v-if="usage" text="Daily messages remaining">
                <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
                  {{ usage.remaining }}/{{ usage.limit }}
                </span>
              </UTooltip>
              <UChatPromptSubmit
                color="neutral"
                size="sm"
                :status="chat.status"
                :disabled="chat.status === 'ready' && !input.trim()"
                @stop="chat.stop()"
                @reload="chat.regenerate()"
              />
            </template>
          </UChatPrompt>

          <div class="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion.title"
              class="flex sm:flex-col gap-3 p-4 rounded-lg border border-default bg-default hover:bg-elevated/50 text-left transition-colors cursor-pointer"

              @click="askQuestion(suggestion.question)"
            >
              <UIcon :name="suggestion.icon" class="size-5 text-muted shrink-0" />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  {{ suggestion.title }}
                </p>
                <p class="text-sm text-muted mt-0.5 hidden sm:block">
                  {{ suggestion.description }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex-1 overflow-y-auto overscroll-none">
        <UTheme :ui="chatTheme">
          <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <UChatMessages
              should-auto-scroll
              :messages="chat.messages"
              :status="chat.status"
              class="pt-10 pb-4"
            >
              <template #indicator>
                <AgentIndicator />
              </template>

              <template #content="{ message }">
                <ChatContent :message="message" :index="0" :chat="chat" />
              </template>

              <template #actions="{ message }">
                <ChatMessageActions
                  v-if="message.role === 'assistant'"
                  :message="message"
                  :vote="votes.get(message.id) ?? null"
                  @vote="vote"
                />
              </template>
            </UChatMessages>
          </div>
        </UTheme>
      </div>

      <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div v-if="rateLimitReached" class="flex items-center justify-center gap-2 py-4 text-sm text-muted">
          <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
          <span>Daily limit reached. Try again tomorrow.</span>
        </div>
        <UChatPrompt
          v-else
          v-model="input"
          :error="chat.error"
          placeholder="Ask anything…"
          variant="subtle"
          :rows="2"
          :maxrows="8"
          autofocus
          class="[view-transition-name:chat-prompt] rounded-b-none"
          :ui="{ base: 'px-1.5', root: 'rounded-b-none' }"
          @submit="onSubmit"
        >
          <template #footer>
            <UTooltip v-if="usage" text="Daily messages remaining">
              <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
                {{ usage.remaining }}/{{ usage.limit }}
              </span>
            </UTooltip>
            <UChatPromptSubmit
              :status="chat.status"
              :disabled="chat.status === 'ready' && !input.trim()"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </div>
    </template>
  </div>
</template>
