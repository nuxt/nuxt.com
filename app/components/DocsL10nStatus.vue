<script setup lang="ts">
import type { SegmentStatus } from '@diglot/core'
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

const STATUSES: SegmentStatus[] = ['untranslated', 'machine', 'pending-review', 'edited', 'verified', 'rejected']
const legend = computed(() => STATUSES.filter(status => coverage.value.byStatus[status]))

const id = useId()
const descriptionId = (status: string | undefined) => `${id}-${status ?? 'untranslated'}`

const reference = ref<HTMLElement>()
const open = ref(false)
const sources = new Map<string, Promise<L10nSegmentSource | null>>()
const source = ref<L10nSegmentSource | null>()

function inspect(event: Event) {
  if (!show.value || editorOpen.value) return
  const block = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-l10n-hash]')
  if (!block || block === reference.value) return

  block.setAttribute('aria-describedby', descriptionId(block.dataset.l10n))
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
  if (!show.value || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const element = event.target as HTMLElement | null
  const block = element?.closest<HTMLElement>('[data-l10n-hash]')
  if (!block || element?.closest('a, button')) return
  edit(block.dataset.l10nHash)
})

useEventListener(() => props.target, 'keydown', (event: KeyboardEvent) => {
  const block = event.target as HTMLElement
  if (!show.value || (event.key !== 'Enter' && event.key !== ' ') || !block.matches?.('[data-l10n-hash]')) return
  event.preventDefault()
  edit(block.dataset.l10nHash)
})

/** In review mode every block takes focus, and describes its status and how to edit it. */
function focusable(value: boolean) {
  for (const block of props.target?.querySelectorAll<HTMLElement>('[data-l10n-hash]') ?? []) {
    if (value) {
      block.tabIndex = 0
      block.setAttribute('aria-describedby', descriptionId(block.dataset.l10n))
    } else {
      block.removeAttribute('tabindex')
      block.removeAttribute('aria-describedby')
    }
  }
}

watch([show, () => props.meta, () => props.target], ([value]) => nextTick(() => focusable(value)), { immediate: true })

watch(show, (value) => {
  if (value) return
  open.value = false
  editorOpen.value = false
})

function published() {
  sources.clear()
  emit('published')
}
watch(open, (value) => {
  if (!value) reference.value = undefined
})

const hash = computed(() => reference.value?.dataset.l10nHash)
const status = computed(() => (source.value?.status ?? reference.value?.dataset.l10n) as SegmentStatus | undefined)
</script>

<template>
  <div class="not-prose mb-6 space-y-2 text-sm text-muted" data-l10n-summary>
    <div class="flex items-center gap-2">
      <p class="flex-1 min-w-0 flex flex-wrap gap-x-1">
        <span class="whitespace-nowrap">{{ machine ? strings.machine : strings.reviewedTranslation }} ·</span>
        <span class="whitespace-nowrap">{{ strings.reviewed(reviewedShare(coverage)) }}<template v-if="pending"> · <span class="text-highlighted">{{ strings.toReview }}</span><span class="sr-only"> : {{ strings.pending }}</span></template></span>
      </p>
      <UButton
        :to="path"
        external
        hreflang="en"
        lang="en"
        label="English"
        icon="i-lucide-languages"
        size="xs"
        color="neutral"
        variant="ghost"
      />
      <UTooltip :text="strings.reviewHint">
        <UButton
          :label="strings.review"
          :aria-pressed="show"
          icon="i-lucide-pencil-line"
          size="xs"
          color="neutral"
          :variant="show ? 'solid' : 'outline'"
          :ui="{ label: 'sr-only sm:not-sr-only' }"
          @click="show = !show"
        />
      </UTooltip>
    </div>

    <ul v-if="show && legend.length" class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <li v-for="item in legend" :key="item" :data-l10n="item">
        {{ strings.legend[item] }}
      </li>
    </ul>

    <span v-for="item in STATUSES" :id="descriptionId(item)" :key="item" hidden>{{ strings.status[item] }}. {{ strings.reviewBlockHint }}</span>

    <ClientOnly>
      <UPopover
        v-model:open="open"
        :reference="reference"
        :content="{ side: 'top', align: 'start', onOpenAutoFocus: (event: Event) => event.preventDefault() }"
      >
        <template #content>
          <div class="max-w-sm p-3 text-xs space-y-2">
            <p v-if="status" class="font-medium text-highlighted">
              {{ strings.status[status] }}
            </p>
            <p v-if="source" lang="en" class="text-toned whitespace-pre-wrap">
              <span class="sr-only" :lang="meta.locale">{{ strings.source }} : </span>{{ source.source }}
            </p>
            <p v-else-if="source === undefined" class="text-muted">
              {{ strings.loading }}
            </p>
            <p v-if="source?.by || source?.model" class="text-muted">
              {{ source.by ? `@${source.by}` : source.model }}
            </p>
            <div class="flex items-center justify-between gap-3">
              <code class="text-muted font-mono">{{ hash }}</code>
              <UButton
                v-if="hash"
                :label="strings.improve"
                variant="link"
                color="neutral"
                size="xs"
                class="p-0 underline underline-offset-2"
                @click="edit(hash)"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <DocsL10nEditor
        :key="`${meta.locale}:${path}`"
        v-model:open="editorOpen"
        v-model:hash="editorHash"
        :locale="meta.locale"
        :path="path"
        :target="target"
        @published="published"
      />
    </ClientOnly>
  </div>
</template>
