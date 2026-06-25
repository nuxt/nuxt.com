<script setup lang="ts">
import type { AgentChatHandle } from '../../composables/eve/types'

const input = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  pasteAttachments?: TextPasteAttachment[]
  canSubmit?: boolean
  status?: 'ready' | 'streaming' | 'submitted' | 'error'
  error?: Error
  usage?: { used: number, remaining: number, limit: number }
  variant?: 'subtle' | 'naked'
  size?: 'sm' | 'md'
  chat?: AgentChatHandle
  submitDisabled?: boolean
  submitColor?: 'neutral' | 'primary'
  ui?: Record<string, string>
  class?: string
}>(), {
  pasteAttachments: () => [],
  canSubmit: false,
  variant: 'subtle',
  submitColor: 'neutral'
})

defineEmits<{
  submit: []
  paste: [event: ClipboardEvent]
  removeAttachment: [index: number]
  restoreAttachment: [index: number]
}>()

const chatPromptRef = useTemplateRef('chatPromptRef')

defineExpose({
  focus: () => chatPromptRef.value?.textareaRef?.focus()
})

const promptStatus = computed(() => props.status ?? props.chat?.status ?? 'ready')
const promptError = computed(() => props.error ?? props.chat?.error)
const isSubmitDisabled = computed(() => {
  if (props.submitDisabled !== undefined) return props.submitDisabled
  return promptStatus.value === 'ready' && !props.canSubmit
})
</script>

<template>
  <UChatPrompt
    ref="chatPromptRef"
    v-model="input"
    :error="promptError"
    placeholder="Ask anything…"
    :variant="variant"
    :size="size"
    :rows="2"
    :maxrows="5"
    autofocus
    :class="props.class"
    :ui="ui"
    @submit="$emit('submit')"
    @paste="$emit('paste', $event)"
  >
    <template v-if="pasteAttachments.length" #header>
      <AgentPasteAttachment
        v-for="(attachment, index) in pasteAttachments"
        :key="`${attachment.name}-${index}`"
        :attachment="attachment"
        @remove="$emit('removeAttachment', index)"
        @restore="$emit('restoreAttachment', index)"
      />
    </template>

    <template #footer>
      <slot name="footer-left">
        <ClientOnly>
          <UTooltip v-if="usage" text="Daily messages remaining">
            <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
              {{ usage.remaining }}/{{ usage.limit }}
            </span>
          </UTooltip>
        </ClientOnly>
      </slot>

      <UChatPromptSubmit
        :color="submitColor"
        size="sm"
        :status="promptStatus"
        :disabled="isSubmitDisabled"
        @stop="chat?.stop()"
        @reload="chat?.regenerate()"
      />
    </template>
  </UChatPrompt>
</template>
