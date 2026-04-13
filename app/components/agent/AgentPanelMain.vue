<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'
import type { FaqCategory } from '~/types/agent'

defineProps<{
  chat: Chat<UIMessage>
  faqQuestions: FaqCategory[]
}>()

const emit = defineEmits<{
  askQuestion: [question: string]
}>()
</script>

<template>
  <UTheme
    :ui="{
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
    }"
  >
    <UChatMessages
      v-if="chat.messages.length"
      should-auto-scroll
      :messages="chat.messages"
      :status="chat.status"
      compact
      class="px-0 gap-2"
      :user="{ ui: { container: 'max-w-full' } }"
    >
      <template #indicator>
        <AgentIndicator />
      </template>

      <template #content="{ message }">
        <ChatContent :message="message" :index="0" :chat="chat" />
      </template>
    </UChatMessages>

    <div v-else class="flex flex-col">
      <div class="relative h-48 overflow-hidden rounded-lg mx-1">
        <AgentShader />
      </div>

      <div class="flex flex-col gap-6 mt-6">
        <UPageLinks
          v-for="category in faqQuestions"
          :key="category.category"
          :title="category.category"
          :links="category.items.map(item => ({ label: item, onClick: () => emit('askQuestion', item) }))"
        />
      </div>
    </div>
  </UTheme>
</template>
