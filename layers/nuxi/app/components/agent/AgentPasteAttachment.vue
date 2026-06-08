<script setup lang="ts">
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
const previewLoading = ref(false)

const { height: windowHeight } = useWindowSize()

const preview = computed(() => attachmentPreview(props.attachment.content, 56))
const extensionMeta = computed(() => getExtensionMeta(props.attachment.name))
const typeLabel = computed(() => extensionMeta.value.label)
const icon = computed(() => extensionMeta.value.icon)
const lineCount = computed(() => props.attachment.content.split('\n').length)
const comarkContent = computed(() => attachmentToComark(props.attachment.content, props.attachment.name))
const isMarkdown = computed(() => isRenderableMarkdown(props.attachment.name))

const PANEL_HEADER_PX = 37
const PANEL_PADDING_PX = 20
const LINE_PX = 16.5

const panelHeightPx = computed(() => {
  const maxPanel = Math.min(720, windowHeight.value * 0.8)
  const maxContent = maxPanel - PANEL_HEADER_PX
  const estimatedContent = lineCount.value * LINE_PX + PANEL_PADDING_PX
  const contentHeight = Math.min(Math.max(estimatedContent, 120), maxContent)
  return contentHeight + PANEL_HEADER_PX
})

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

async function openPreview() {
  if (open.value) return

  open.value = true
  previewLoading.value = true
  await nextTick()
  requestAnimationFrame(() => {
    previewLoading.value = false
  })
}
</script>

<template>
  <component
    :is="variant === 'preview' ? 'button' : 'div'"
    :type="variant === 'preview' ? 'button' : undefined"
    class="items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-left transition-colors"
    :class="[
      variant === 'preview'
        ? 'inline-flex w-fit min-w-0 max-w-full border border-default/60'
        : 'inline-flex w-fit max-w-80 ring ring-default/60',
      variant === 'preview' ? 'hover:bg-muted/60' : ''
    ]"
    @click="variant === 'preview' ? openPreview() : undefined"
  >
    <UIcon :name="icon" class="size-3.5 shrink-0" />

    <div
      class="min-w-0 leading-none"
      :class="variant === 'preview' ? 'max-w-[14rem]' : 'max-w-60'"
    >
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
      content: 'w-[calc(100vw-1rem)] max-w-3xl sm:max-w-4xl overflow-hidden rounded-xl border border-default/30 bg-default shadow-md'
    }"
  >
    <template #content>
      <div
        class="flex flex-col"
        :style="{ height: `${panelHeightPx}px` }"
      >
        <div class="flex h-[37px] shrink-0 items-center justify-between gap-3 border-b border-default/40 px-3 py-2">
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

        <div class="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain px-3 py-2.5 sm:px-4">
          <div
            v-if="previewLoading"
            class="absolute inset-0 flex items-center justify-center bg-default/80"
          >
            <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-dimmed" />
          </div>

          <AgentComark
            :markdown="comarkContent"
            :class="comarkClass"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
