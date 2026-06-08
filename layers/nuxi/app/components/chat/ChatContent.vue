<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isFileUIPart, isToolUIPart, isReasoningUIPart, isTextUIPart } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'

defineProps<{
  message: UIMessage
}>()

const streamingCaret = { class: 'inline-block w-2 h-[1em] bg-current align-middle ml-px opacity-80 animate-pulse' }

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
</script>

<template>
  <div v-if="message.role === 'user'" class="flex flex-col items-start gap-1.5">
    <div v-if="getMessagePagePath(message)" class="flex items-center gap-1 w-fit">
      <img src="/icon.png" alt="Nuxt" class="size-3.5 shrink-0">
      <span class="text-xs text-muted">{{ getMessagePagePath(message)!.replace(/^\//, '') }}</span>
    </div>

    <AgentPasteAttachment
      v-for="(part, index) in getUserFileParts(message)"
      :key="`${message.id}-file-${index}`"
      :attachment="filePartToAttachment(part)"
      variant="preview"
    />

    <p
      v-for="(part, partIndex) in getUserTextParts(message)"
      :key="`${message.id}-text-${partIndex}`"
      class="whitespace-pre-wrap text-sm/6"
    >
      {{ part.text }}
    </p>
  </div>

  <div v-else class="w-full min-w-0 flex flex-col gap-4">
    <template v-for="(part, partIndex) in getMergedParts(message.parts)" :key="`${message.id}-${part.type}-${partIndex}`">
      <UChatReasoning
        v-if="isReasoningUIPart(part)"
        :text="part.text"
        :streaming="isPartStreaming(part)"
        icon="i-lucide-brain"
        chevron="leading"
      >
        <AgentComark
          :markdown="part.text"
          :streaming="isPartStreaming(part)"
          :caret="isPartStreaming(part) ? streamingCaret : false"
        />
      </UChatReasoning>

      <ChatToolPart v-else-if="isToolUIPart(part)" :part="part" />

      <AgentComark
        v-else-if="isTextUIPart(part) && part.text.length > 0"
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
        :caret="isPartStreaming(part) ? streamingCaret : false"
      />
    </template>
  </div>
</template>
