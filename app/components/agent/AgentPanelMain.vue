<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'
import type { FaqCategory } from '~/types/agent'

defineProps<{
  chat: Chat<UIMessage>
  faqQuestions: FaqCategory[]
}>()

const chatId = inject<Ref<string>>('chat-id')

const emit = defineEmits<{
  askQuestion: [question: string]
  vote: [message: UIMessage, isUpvoted: boolean]
}>()

const votes = defineModel<Map<string, boolean>>('votes', { required: true })

const AGENT_CHAT_THEME = {
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
  <div>
    <UTheme :ui="AGENT_CHAT_THEME">
      <UChatMessages
        v-if="chat.messages.length"
        should-auto-scroll
        :messages="chat.messages"
        :status="chat.status"
        compact
        class="px-0 gap-2"
        :user="{ ui: { container: 'max-w-full' } }"
        :assistant="{ ui: { actions: 'has-data-[state=open]:opacity-100' } }"
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
            :streaming="chat.status === 'streaming' && message.id === chat.messages.at(-1)?.id"
            :chat-id="chatId"
            :can-regenerate="message.id === chat.messages.at(-1)?.id && chat.status === 'ready'"
            @vote="(msg, isUpvoted) => $emit('vote', msg, isUpvoted)"
            @regenerate="chat.regenerate()"
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
  </div>
</template>
