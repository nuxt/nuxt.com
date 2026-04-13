<script setup lang="ts">
import { DefaultChatTransport } from 'ai'
import { Chat } from '@ai-sdk/vue'

const { messages, collapseToSidebar } = useNuxtAgent()
const { track } = useAnalytics()
const toast = useToast()
const input = ref('')

let _skipSync = false

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/assistant'
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

function onSubmit() {
  if (!input.value.trim()) return

  track('Nuxt Agent Message Sent', { query: input.value, source: 'chat-page' })
  chat.sendMessage({ text: input.value })
  input.value = ''
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
        <svg class="absolute top-16 opacity-20 text-highlighted -z-1 size-72 sm:size-88" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M168 200H279C282.542 200 285.932 198.756 289 197C292.068 195.244 295.23 193.041 297 190C298.77 186.959 300.002 183.51 300 179.999C299.998 176.488 298.773 173.04 297 170.001L222 41C220.23 37.96 218.067 35.7552 215 34C211.933 32.2448 207.542 31 204 31C200.458 31 197.067 32.2448 194 34C190.933 35.7552 188.77 37.96 187 41L168 74L130 9.99764C128.228 6.95784 126.068 3.75491 123 2C119.932 0.245087 116.542 0 113 0C109.458 0 106.068 0.245087 103 2C99.9323 3.75491 96.7717 6.95784 95 9.99764L2 170.001C0.226979 173.04 0.00154312 176.488 1.90993e-06 179.999C-0.0015393 183.51 0.229648 186.959 2 190C3.77035 193.04 6.93245 195.244 10 197C13.0675 198.756 16.4578 200 20 200H90C117.737 200 137.925 187.558 152 164L186 105L204 74L259 168H186L168 200ZM89 168H40L113 42L150 105L125.491 147.725C116.144 163.01 105.488 168 89 168Z" stroke="currentColor" stroke-width="1.5" />
        </svg>

        <div class="text-center max-w-lg mx-auto px-4">
          <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted tracking-tight">
            Welcome to Nuxt Agent
          </h1>
          <p class="text-base text-muted mt-2">
            Ask anything or explore docs, modules, deployment, and more.
          </p>
        </div>

        <div class="w-full max-w-2xl flex flex-col gap-6">
          <UChatPrompt
            v-model="input"
            :error="chat.error"
            placeholder="Ask anything…"
            variant="subtle"
            autofocus
            class="[view-transition-name:chat-prompt]"
            :ui="{ base: 'px-1.5' }"
            @submit="onSubmit"
          >
            <template #footer>
              <div />
              <UChatPromptSubmit
                color="neutral"
                size="sm"
                :disabled="!input.trim()"
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
            </UChatMessages>
          </div>
        </UTheme>
      </div>

      <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <UChatPrompt
          v-model="input"
          :error="chat.error"
          placeholder="Ask anything…"
          variant="subtle"
          autofocus
          class="[view-transition-name:chat-prompt] rounded-b-none"
          :ui="{ base: 'px-1.5', root: 'rounded-b-none' }"
          @submit="onSubmit"
        >
          <template #footer>
            <div />
            <UChatPromptSubmit
              :status="chat.status"
              :disabled="!input.trim()"
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
