<script setup lang="ts">
import type { UIMessage } from 'ai'

const props = defineProps<{
  chatId: string
  initialMessages?: UIMessage[]
}>()

const {
  faqQuestions,
  usage,
  rateLimitReached,
  currentPage,
  pageContextDismissed,
  pageContextEnabled,
  consumePendingPrompt,
  nuxiMood
} = useNuxtAgent()
const { loggedIn } = useUserSession()
const { refresh: refreshChats } = useChatsData()

provide('chat-id', toRef(props, 'chatId'))

const {
  chat,
  input,
  pasteAttachments,
  canSubmit,
  handlePaste,
  removeAttachment,
  restoreToInput,
  votes,
  vote,
  onSubmit,
  askQuestion,
  send
} = useAgentChat({
  chatId: props.chatId,
  initialMessages: props.initialMessages,
  source: 'prompt',
  withPageContext: 'when-enabled',
  onFinish: () => {
    if (loggedIn.value) refreshChats()
  }
})

watch(() => chat.status, (status) => {
  if (status === 'streaming') nuxiMood.value = 'thinking'
  else if (status === 'submitted') nuxiMood.value = 'thinking'
  else if (status === 'ready' && chat.messages.length > 0) nuxiMood.value = 'happy'
  else nuxiMood.value = 'idle'
}, { immediate: true })

onMounted(() => {
  const prompt = consumePendingPrompt()
  if (prompt) send(prompt)
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-1 flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <AgentPanelMain
        v-model:votes="votes"
        :chat="chat"
        :faq-questions="faqQuestions"
        class="flex flex-col gap-4"
        @ask-question="askQuestion"
        @vote="vote"
      />
    </div>

    <AgentPanelFooter
      v-model="input"
      :chat="chat"
      :current-page="currentPage"
      :page-context-enabled="pageContextEnabled"
      :rate-limit-reached="rateLimitReached"
      :usage="usage"
      :paste-attachments="pasteAttachments"
      :can-submit="canSubmit"
      class="shrink-0 border-t border-default"
      @submit="onSubmit"
      @paste="handlePaste"
      @remove-paste-attachment="removeAttachment($event)"
      @restore-paste-attachment="restoreToInput($event)"
      @dismiss-page-context="pageContextDismissed = true"
      @add-page-context="pageContextDismissed = false"
    />
  </div>
</template>
