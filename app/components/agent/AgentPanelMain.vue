<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'
import { AGENT_CHAT_THEME } from '~/composables/useAgentChat'
import type { FaqCategory } from '~/types/agent'

defineProps<{
  chat: Chat<UIMessage>
  faqQuestions: FaqCategory[]
}>()

const emit = defineEmits<{
  askQuestion: [question: string]
  vote: [message: UIMessage, isUpvoted: boolean]
}>()

const votes = defineModel<Map<string, boolean>>('votes', { required: true })
</script>

<template>
  <UTheme :ui="AGENT_CHAT_THEME">
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
        <ChatContent :message="message" />
      </template>

      <template #actions="{ message }">
        <ChatMessageActions
          v-if="message.role === 'assistant'"
          :message="message"
          :vote="votes.get(message.id) ?? null"
          @vote="(msg, isUpvoted) => $emit('vote', msg, isUpvoted)"
        />
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
