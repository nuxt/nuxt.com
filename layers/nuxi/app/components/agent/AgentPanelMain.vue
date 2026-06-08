<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'
import { AGENT_CHAT_THEME, AGENT_USER_MESSAGE_UI_COMPACT } from '../../composables/useAgentChat'

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
        class="gap-2 px-0"
        :user="{ ui: AGENT_USER_MESSAGE_UI_COMPACT }"
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
