<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { AgentChatHandle } from '../../composables/eve/types'

const input = defineModel<string>('input', { required: true })

const props = withDefaults(defineProps<{
  chat: AgentChatHandle
  chatId: string
  prompt: { pasteAttachments: TextPasteAttachment[], canSubmit: boolean }
  usage?: { used: number, remaining: number, limit: number }
  rateLimitReached?: boolean
  compact?: boolean
  showFaqEmpty?: boolean
  faqQuestions?: FaqCategory[]
  showActions?: boolean
  showUserTimestamps?: boolean
  spacingOffset?: number
  getVote: (messageId: string) => boolean | null
  variant?: 'subtle' | 'naked'
  size?: 'sm' | 'md'
  promptClass?: string
  promptUi?: Record<string, string>
  submitDisabled?: boolean
  rateLimitVariant?: 'sticky' | 'footer'
  loginHintBar?: boolean
}>(), {
  compact: false,
  showFaqEmpty: false,
  faqQuestions: () => [],
  showActions: true,
  showUserTimestamps: false,
  spacingOffset: 0,
  variant: 'subtle',
  rateLimitVariant: 'sticky',
  loginHintBar: false
})

const emit = defineEmits<{
  submit: []
  paste: [event: ClipboardEvent]
  removeAttachment: [index: number]
  restoreAttachment: [index: number]
  vote: [message: UIMessage, isUpvoted: boolean]
  askQuestion: [question: string]
}>()

const { loggedIn } = useUserSession()
const showLoginHint = computed(() => props.loginHintBar || !loggedIn.value)

const promptRef = useTemplateRef('promptRef')
defineExpose({
  focus: () => promptRef.value?.focus()
})
</script>

<template>
  <AgentChatMessages
    :chat="chat"
    :chat-id="chatId"
    :compact="compact"
    :show-faq-empty="showFaqEmpty"
    :faq-questions="faqQuestions"
    :show-actions="showActions"
    :show-user-timestamps="showUserTimestamps"
    :spacing-offset="spacingOffset"
    :get-vote="getVote"
    :class="compact ? 'flex flex-col gap-4' : 'flex-1 pt-4 pb-4 sm:pb-6'"
    @ask-question="emit('askQuestion', $event)"
    @vote="(message, isUpvoted) => emit('vote', message, isUpvoted)"
  />

  <AgentRateLimitBanner v-if="rateLimitReached" :variant="rateLimitVariant" />

  <div
    v-else
    class="flex flex-col gap-1.5"
    :class="rateLimitVariant === 'sticky' ? 'sticky bottom-0 z-10 bg-default' : ''"
  >
    <slot name="before-prompt" />

    <AgentLoginHint v-if="showLoginHint" :bar="loginHintBar" />

    <AgentChatPrompt
      ref="promptRef"
      v-model="input"
      v-bind="prompt"
      :chat="chat"
      :usage="usage"
      :variant="variant"
      :size="size"
      :submit-disabled="submitDisabled"
      :class="promptClass"
      :ui="promptUi"
      @submit="emit('submit')"
      @paste="emit('paste', $event)"
      @remove-attachment="emit('removeAttachment', $event)"
      @restore-attachment="emit('restoreAttachment', $event)"
    >
      <template v-if="$slots['prompt-footer-left']" #footer-left>
        <slot name="prompt-footer-left" />
      </template>
    </AgentChatPrompt>
  </div>
</template>
