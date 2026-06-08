<script setup lang="ts">
import {
  attachmentPreview,
  attachmentToComark,
  attachmentTypeLabel,
  guessAttachmentIcon,
  isRenderableMarkdown,
  type TextPasteAttachment
} from '../../../shared/utils/paste-attachment'

const props = withDefaults(defineProps<{
  attachment: TextPasteAttachment
  variant?: 'composer' | 'preview'
}>(), {
  variant: 'composer'
})

defineEmits<{
  remove: []
  restore: []
}>()

const open = ref(false)

const preview = computed(() => attachmentPreview(props.attachment.content, 56))
const icon = computed(() => guessAttachmentIcon(props.attachment.name))
const typeLabel = computed(() => attachmentTypeLabel(props.attachment.name))
const lineCount = computed(() => props.attachment.content.split('\n').length)
const comarkContent = computed(() => attachmentToComark(props.attachment.content, props.attachment.name))
const isMarkdown = computed(() => isRenderableMarkdown(props.attachment.name))

const comarkClass = computed(() => isMarkdown.value
  ? [
      'text-[13px] leading-relaxed text-default',
      '[&_*:first-child]:mt-0 [&_*:last-child]:mb-0',
      '[&_pre]:my-2 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-default/50 [&_pre]:bg-muted/30 [&_pre]:p-3 [&_pre]:text-[11px] [&_pre]:leading-[1.5]'
    ].join(' ')
  : [
      'font-mono text-[11px] leading-[1.5] text-default',
      '[&_*:first-child]:mt-0 [&_*:last-child]:mb-0',
      '[&_.line]:block [&_.line]:min-w-fit',
      '[&_code]:block [&_code]:whitespace-pre',
      '[&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:overflow-y-visible',
      '[&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0',
      '[&_pre]:text-[11px] [&_pre]:leading-[1.5]'
    ].join(' '))

function openPreview() {
  open.value = true
}
</script>

<template>
  <component
    :is="variant === 'preview' ? 'button' : 'div'"
    :type="variant === 'preview' ? 'button' : undefined"
    class="inline-flex w-fit max-w-80 items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-left ring ring-default/60 transition-colors"
    :class="variant === 'preview' ? 'hover:bg-muted/60' : ''"
    @click="variant === 'preview' ? openPreview() : undefined"
  >
    <UIcon :name="icon" class="size-3.5 shrink-0" />

    <div class="min-w-0 max-w-60 leading-none">
      <button
        v-if="variant === 'composer'"
        type="button"
        class="block w-full truncate text-left font-mono text-[11px] text-highlighted hover:underline"
        @click.stop="openPreview"
      >
        {{ preview }}
      </button>
      <span
        v-else
        class="block truncate font-mono text-[11px] text-highlighted"
      >
        {{ preview }}
      </span>

      <UButton
        v-if="variant === 'composer'"
        variant="link"
        size="xs"
        color="primary"
        label="Show in text field"
        class="mt-0.5 h-auto p-0 text-[11px]"
        @click.stop="$emit('restore')"
      />
    </div>

    <UButton
      v-if="variant === 'composer'"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      aria-label="Remove attachment"
      @click.stop="$emit('remove')"
    />
  </component>

  <UModal
    v-model:open="open"
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-3xl sm:max-w-4xl overflow-hidden rounded-xl border border-default/30 bg-default shadow-md'
    }"
  >
    <template #content>
      <div v-if="open" class="flex max-h-[min(80vh,720px)] flex-col">
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-default/40 px-3 py-2">
          <div class="flex min-w-0 items-center gap-2">
            <UIcon :name="icon" class="size-3.5 shrink-0 text-dimmed" />
            <span class="text-xs font-medium text-highlighted">{{ typeLabel }}</span>
            <span class="font-mono text-[10px] tabular-nums text-dimmed">
              {{ lineCount }} {{ lineCount === 1 ? 'line' : 'lines' }}
            </span>
          </div>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            aria-label="Close"
            @click="open = false"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-auto overscroll-contain px-3 py-2.5 sm:px-4">
          <AgentComark
            :markdown="comarkContent"
            :class="comarkClass"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
