<script setup lang="ts">
import { DefaultChatTransport } from 'ai'
import { Chat } from '@ai-sdk/vue'

const { messages, faqQuestions, collapseToSidebar } = useAssistant()
const { track } = useAnalytics()
const router = useRouter()
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

const marqueeItems = computed(() => {
  const items: { label: string, prompt: string }[] = []
  for (const category of faqQuestions.value) {
    for (const item of category.items) {
      items.push({ label: item, prompt: item })
    }
  }
  return items
})

function onSubmit() {
  if (!input.value.trim()) return

  track('Assistant Message Sent', { query: input.value, source: 'chat-page' })
  chat.sendMessage({ text: input.value })
  input.value = ''
}

function askQuestion(question: string) {
  track('Assistant FAQ Clicked', { question, source: 'chat-page' })
  input.value = question
  onSubmit()
}

function clearMessages() {
  track('Assistant Chat Cleared', { source: 'chat-page' })
  if (chat.status === 'streaming') {
    chat.stop()
  }
  messages.value = []
  chat.messages = []
}

function goBack() {
  collapseToSidebar()
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/docs')
  }
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
    <!-- Floating toolbar -->
    <div class="absolute top-0 inset-x-0 z-10 backdrop-blur pointer-events-none">
      <div class="flex items-center justify-between px-3 py-2 pointer-events-auto">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          leading-icon="i-lucide-arrow-left"
          label="Back to docs"
          @click="goBack"
        />

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

    <!-- Empty state -->
    <template v-if="!chat.messages.length">
      <div class="flex-1 overflow-y-auto overscroll-none">
        <div class="mx-auto w-full max-w-3xl px-4 sm:px-6 flex flex-col min-h-full">
          <div class="flex flex-1 flex-col items-center justify-center py-8">
            <div class="flex w-full max-w-lg flex-col items-center gap-10 text-center">
              <div class="flex flex-col items-center gap-4">
                <div class="relative">
                  <img
                    src="/icon.png"
                    alt="Nuxt"
                    width="72"
                    height="72"
                    class="size-16 rounded-full bg-muted object-cover ring-2 ring-default shadow-sm sm:size-18"
                  >
                  <span class="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full bg-elevated text-highlighted ring-2 ring-default">
                    <UIcon name="i-custom-ai" class="size-3.5 opacity-95" />
                  </span>
                </div>
                <div class="flex flex-col gap-2">
                  <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
                    Ask anything about Nuxt
                  </h1>
                  <p class="mx-auto max-w-xs text-sm/6 text-muted">
                    Get help with docs, modules, deployment, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <UChatPrompt
            v-model="input"
            :error="chat.error"
            placeholder="Ask about Nuxt..."
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

          <div v-if="marqueeItems.length" class="flex flex-wrap gap-2 mt-4 mb-8">
            <UButton
              v-for="q in marqueeItems"
              :key="q.label"
              :label="q.label"
              size="sm"
              color="neutral"
              variant="outline"
              class="rounded-full"
              @click="askQuestion(q.prompt)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Conversation -->
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
                <AssistantIndicator />
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
          placeholder="Ask about Nuxt..."
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
