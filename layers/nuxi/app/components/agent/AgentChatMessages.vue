<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'

withDefaults(defineProps<{
  chat: Chat<UIMessage>
  chatId: string
  compact?: boolean
  showFaqEmpty?: boolean
  faqQuestions?: FaqCategory[]
  showUserTimestamps?: boolean
  showActions?: boolean
  spacingOffset?: number
  getVote: (messageId: string) => boolean | null
}>(), {
  compact: false,
  showFaqEmpty: false,
  faqQuestions: () => [],
  showUserTimestamps: false,
  showActions: true,
  spacingOffset: 0
})

const emit = defineEmits<{
  askQuestion: [question: string]
  vote: [message: UIMessage, isUpvoted: boolean]
}>()
</script>

<template>
  <UTheme :ui="AGENT_CHAT_THEME">
    <UChatMessages
      v-if="chat.messages.length"
      should-auto-scroll
      :messages="chat.messages"
      :status="chat.status"
      :compact="compact"
      :spacing-offset="spacingOffset"
      :class="compact ? 'gap-2 px-0' : 'flex-1 pt-4 pb-4 sm:pb-6'"
      :user="{ ui: compact ? AGENT_USER_MESSAGE_UI_COMPACT : AGENT_USER_MESSAGE_UI }"
      :assistant="{ ui: { body: 'flex-1', actions: 'has-data-[state=open]:opacity-100' } }"
      :ui="compact ? undefined : { root: '[&>article]:last-of-type:min-h-0' }"
    >
      <template #indicator>
        <AgentIndicator />
      </template>

      <template #content="{ message }">
        <ChatContent :message="message" />
      </template>

      <template v-if="showActions" #actions="{ message }">
        <ChatMessageActions
          v-if="message.role === 'assistant'"
          :message="message"
          :vote="getVote(message.id)"
          :streaming="chat.status === 'streaming' && message.id === chat.messages.at(-1)?.id"
          :chat-id="chatId"
          :can-regenerate="message.id === chat.messages.at(-1)?.id && chat.status === 'ready'"
          @vote="(msg, isUpvoted) => emit('vote', msg, isUpvoted)"
          @regenerate="chat.regenerate()"
        />
        <UTooltip
          v-else-if="showUserTimestamps && message.role === 'user' && messageTime(message)"
          :text="messageFullTime(message)!"
          :content="{ side: 'bottom' }"
        >
          <span class="text-xs text-dimmed select-none">{{ messageTime(message) }}</span>
        </UTooltip>
      </template>
    </UChatMessages>

    <div v-else-if="showFaqEmpty" class="flex flex-col">
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
