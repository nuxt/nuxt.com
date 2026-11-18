<script setup lang="ts">
import type { UIMessage, ReasoningUIPart } from 'ai'
import { isFileUIPart, isToolUIPart, isReasoningUIPart, isTextUIPart } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import type { ToolPart } from '../../composables/useChatTools'
import ChatToolCall from './ChatToolCall.vue'
import ChatToolActivity from './ChatToolActivity.vue'

const props = defineProps<{
  message: UIMessage
  animate?: boolean
  streaming?: boolean
  preparing?: boolean
}>()

const parts = computed(() => getMergedParts(props.message.parts))
const activity = computed(() => parts.value.filter((part): part is ToolPart | ReasoningUIPart => isToolUIPart(part) || (isReasoningUIPart(part) && part.text.trim().length > 0)))

const emit = defineEmits<{ pending: [value: boolean] }>()
const pendingParts = new Set<string>()

function onTextPending(key: string, pending: boolean) {
  if (pending) pendingParts.add(key)
  else pendingParts.delete(key)
  emit('pending', pendingParts.size > 0)
}

onBeforeUnmount(() => emit('pending', false))

function getMessagePagePath(message: UIMessage): string | null {
  const metaPath = (message.metadata as { pagePath?: string } | undefined)?.pagePath
  return typeof metaPath === 'string' && metaPath.length > 0 ? metaPath : null
}

function getUserFileParts(message: UIMessage) {
  return message.parts.filter(isFileUIPart)
}

function getUserTextParts(message: UIMessage) {
  return message.parts.filter((part): part is Extract<UIMessage['parts'][number], { type: 'text' }> =>
    isTextUIPart(part) && part.text.length > 0
  )
}

function partKey(part: UIMessage['parts'][number], index: number) {
  if (isToolUIPart(part)) return part.toolCallId
  // Finalized text can carry a different id from its streamed preview.
  return `${part.type}-${index}`
}
</script>

<template>
  <div v-if="message.role === 'user'" class="flex flex-col items-start gap-1.5">
    <div v-if="getMessagePagePath(message)" class="flex items-center gap-1 w-fit">
      <img src="/icon.png" alt="Nuxt" class="size-3.5 shrink-0">
      <span class="text-xs text-muted">{{ getMessagePagePath(message)!.replace(/^\//, '') }}</span>
    </div>

    <div v-if="getUserFileParts(message).length" class="flex flex-wrap gap-1.5">
      <AgentPasteAttachment
        v-for="(part, index) in getUserFileParts(message)"
        :key="`${message.id}-file-${index}`"
        :attachment="filePartToAttachment(part)"
        variant="preview"
      />
    </div>

    <p
      v-for="(part, partIndex) in getUserTextParts(message)"
      :key="`${message.id}-text-${partIndex}`"
      class="whitespace-pre-wrap text-sm/6"
    >
      {{ part.text }}
    </p>
  </div>

  <template v-else>
    <ChatToolActivity v-if="activity.length" :parts="activity" :active="!!streaming" :preparing="preparing" :responding="parts.some(part => isTextUIPart(part) && part.text.length > 0)" />
    <AgentIndicator v-else-if="preparing" />

    <template v-for="(part, partIndex) in parts" :key="partKey(part, partIndex)">
      <ChatToolCall v-if="isToolUIPart(part)" :part="part" />
      <AgentStreamText
        v-else-if="isTextUIPart(part) && part.text.length > 0"
        :value="part.text"
        :streaming="streaming && isPartStreaming(part)"
        :animate="animate"
        @pending="onTextPending(partKey(part, partIndex), $event)"
      />
    </template>
  </template>
</template>
