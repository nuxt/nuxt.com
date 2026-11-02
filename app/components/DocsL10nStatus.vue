<script setup lang="ts">
import { L10N_STRINGS, l10nSourcePath, reviewedShare, type L10nPageMeta, type L10nSegmentSource } from '#shared/utils/l10n'

const props = defineProps<{
  meta: L10nPageMeta
  /** The English page, unprefixed. */
  path: string
  /** The rendered document, whose blocks carry `data-l10n-hash`. */
  target?: HTMLElement | null
}>()

const emit = defineEmits<{
  /** Saved translations are now served. */
  published: []
}>()

/** Review mode: every block shows its status, its English source on hover, and opens the editor on click. */
const show = defineModel<boolean>('show', { default: false })

const strings = computed(() => L10N_STRINGS[props.meta.locale])
const coverage = computed(() => props.meta.coverage)
const machine = computed(() => (coverage.value.byStatus.machine ?? 0) + (coverage.value.byStatus['pending-review'] ?? 0) > 0)
const pending = computed(() => (coverage.value.byStatus['pending-review'] ?? 0) > 0)

const reference = ref<HTMLElement>()
const open = ref(false)
const sources = new Map<string, Promise<L10nSegmentSource | null>>()
const source = ref<L10nSegmentSource | null>()

function inspect(event: Event) {
  if (!show.value || editorOpen.value) return
  const block = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-l10n-hash]')
  if (!block || block === reference.value) return

  const hash = block.dataset.l10nHash!
  reference.value = block
  open.value = true
  source.value = undefined

  let request = sources.get(hash)
  if (!request) {
    request = $fetch<L10nSegmentSource>(l10nSourcePath(props.meta.locale, hash, props.path)).catch(() => null)
    sources.set(hash, request)
  }
  request.then((result) => {
    if (reference.value === block) source.value = result
  })
}

useEventListener(() => props.target, 'mouseover', inspect)
useEventListener(() => props.target, 'focusin', inspect)

const editorOpen = ref(false)
const editorHash = ref<string>()

function edit(hash: string | undefined) {
  open.value = false
  show.value = true
  editorHash.value = hash
  editorOpen.value = true
}

useEventListener(() => props.target, 'click', (event: MouseEvent) => {
  if (!show.value) return
  const block = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-l10n-hash]')
  if (!block) return
  event.preventDefault()
  edit(block.dataset.l10nHash)
}, { capture: true })

watch(show, (value) => {
  if (value) return
  open.value = false
  editorOpen.value = false
})
watch(open, (value) => {
  if (!value) reference.value = undefined
})

const hash = computed(() => reference.value?.dataset.l10nHash)
const status = computed(() => (source.value?.status ?? reference.value?.dataset.l10n) as keyof typeof strings.value.status | undefined)
</script>

<template>
  <div class="not-prose flex items-center gap-2 text-sm text-muted mb-6" data-l10n-summary>
    <p class="flex-1 min-w-0 flex flex-wrap gap-x-1">
      <span class="whitespace-nowrap">{{ machine ? strings.machine : strings.reviewedTranslation }} ·</span>
      <span class="whitespace-nowrap">{{ strings.reviewed(reviewedShare(coverage)) }}<span v-if="pending" class="text-warning" :title="strings.pending"> · {{ strings.toReview }}</span></span>
    </p>
    <UButton
      :to="path"
      external
      hreflang="en"
      lang="en"
      label="English"
      :title="strings.viewInEnglish"
      icon="i-lucide-languages"
      size="xs"
      color="neutral"
      variant="ghost"
    />
    <UButton
      :label="strings.review"
      :title="strings.reviewHint"
      :aria-label="strings.reviewHint"
      :aria-pressed="show"
      icon="i-lucide-pencil-line"
      size="xs"
      color="neutral"
      :variant="show ? 'solid' : 'outline'"
      :ui="{ label: 'hidden sm:inline' }"
      @click="show = !show"
    />

    <ClientOnly>
      <UPopover
        v-model:open="open"
        :reference="reference"
        :content="{ side: 'top', align: 'start' }"
      >
        <template #content>
          <div class="max-w-sm p-3 text-xs space-y-2">
            <p v-if="status" class="font-medium text-highlighted">
              {{ strings.status[status] }}
            </p>
            <p v-if="source" lang="en" class="text-muted whitespace-pre-wrap">
              <span class="sr-only">{{ strings.source }}: </span>{{ source.source }}
            </p>
            <p v-else-if="source === undefined" class="text-dimmed">
              {{ strings.loading }}
            </p>
            <p v-if="source?.by || source?.model" class="text-dimmed">
              {{ source.by ? `@${source.by}` : source.model }}
            </p>
            <div class="flex items-center justify-between gap-3">
              <code class="text-dimmed font-mono">{{ hash }}</code>
              <button v-if="hash" type="button" class="text-primary underline underline-offset-2" @click="edit(hash)">
                {{ strings.improve }}
              </button>
            </div>
          </div>
        </template>
      </UPopover>

      <DocsL10nEditor
        v-model:open="editorOpen"
        v-model:hash="editorHash"
        :locale="meta.locale"
        :path="path"
        :target="target"
        @published="emit('published')"
      />
    </ClientOnly>
  </div>
</template>
