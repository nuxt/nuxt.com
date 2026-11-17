<script setup lang="ts">
import type { AgentChatHandle } from '../../composables/eve/types'
import type { ChatQueueItem } from '../../composables/useChatQueue'

const input = defineModel<string>({ required: true })
/** Bound where Nuxi answers: messages submitted during an answer wait here instead of being dropped. */
const queue = defineModel<ChatQueueItem[]>('queue')

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

const emit = defineEmits<{
  submit: []
  send: []
  paste: [event: ClipboardEvent]
  removeAttachment: [index: number]
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

/** `UChatPrompt` ignores submits with an empty textarea, which would block sending pastes on their own. */
const attachmentsOnly = computed(() =>
  promptStatus.value === 'ready' && !input.value.trim() && props.pasteAttachments.length > 0
)

function submitAttachmentsOnly(event?: KeyboardEvent) {
  if (!attachmentsOnly.value) return
  if (event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
    event.preventDefault()
  }
  emit('submit')
}
</script>

<template>
  <UChatPrompt
    ref="chatPromptRef"
    v-model="input"
    v-model:queue="queue"
    :status="promptStatus"
    :error="promptError"
    placeholder="Ask anything…"
    :variant="variant"
    :size="size"
    :rows="2"
    :maxrows="5"
    autofocus
    :class="props.class"
    :ui="ui"
    @submit="emit('submit')"
    @send="emit('send')"
    @paste="emit('paste', $event)"
    @keydown.enter="submitAttachmentsOnly"
  >
    <template v-if="pasteAttachments.length" #header>
      <div class="flex flex-wrap gap-2.5 pt-1.5 pr-1.5">
        <AgentPasteAttachment
          v-for="(attachment, index) in pasteAttachments"
          :key="`${attachment.name}-${index}`"
          :attachment="attachment"
          @remove="emit('removeAttachment', index)"
        />
      </div>
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
        v-on="attachmentsOnly ? { click: () => submitAttachmentsOnly() } : {}"
        @stop="chat?.stop()"
        @reload="chat?.regenerate()"
      />
    </template>
  </UChatPrompt>
</template>
