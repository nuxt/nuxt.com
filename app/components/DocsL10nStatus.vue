<script setup lang="ts">
import { L10N_STRINGS, l10nImproveUrl, l10nSourcePath, reviewedShare, type L10nPageMeta, type L10nSegmentSource } from '#shared/utils/l10n'

const props = defineProps<{
  meta: L10nPageMeta
  /** The English page, unprefixed. */
  path: string
  /** The rendered document, whose blocks carry `data-l10n-hash`. */
  target?: HTMLElement | null
}>()

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
  if (!show.value) return
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

watch(show, (value) => {
  if (!value) open.value = false
})
watch(open, (value) => {
  if (!value) reference.value = undefined
})

const hash = computed(() => reference.value?.dataset.l10nHash)
const status = computed(() => (source.value?.status ?? reference.value?.dataset.l10n) as keyof typeof strings.value.status | undefined)
</script>

<template>
  <div class="not-prose flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted mb-6" data-l10n-summary>
    <span class="basis-full sm:basis-auto">
      {{ machine ? strings.machine : strings.reviewedTranslation }}, {{ strings.reviewed(reviewedShare(coverage)) }}
    </span>
    <span v-if="pending" class="text-warning">{{ strings.pending }}</span>
    <a :href="path" hreflang="en" class="text-highlighted underline underline-offset-2">{{ strings.viewInEnglish }}</a>
    <USwitch v-model="show" size="xs" :label="strings.showStatus" class="ms-auto" />

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
              <a v-if="hash" :href="l10nImproveUrl(meta.locale, hash)" target="_blank" class="text-primary underline underline-offset-2">
                {{ strings.improve }}
              </a>
            </div>
          </div>
        </template>
      </UPopover>
    </ClientOnly>
  </div>
</template>
