<script setup lang="ts">
const props = defineProps<{
  log: string
  /** The check is still running: the log is the live end of its output, and follows new lines. */
  live?: boolean
}>()

type Tone = 'error' | 'warning' | 'default'
const ERROR = /(?:^|[^a-z])(?:error|err!|fatal|failed|cannot find|not found|exception|enoent)/i
const WARNING = /^\s*(?:warn|⚠)|\bwarning\b/i
const tone = (line: string): Tone => WARNING.test(line) ? 'warning' : ERROR.test(line) ? 'error' : 'default'

/** Failure logs start with a summary, then `==> ` sections (see `fail_with` in the check workflow). */
const parsed = computed(() => {
  const lines = props.log.replace(/\n{3,}/g, '\n\n').split('\n')
  const first = lines.findIndex(line => line.startsWith('==> '))
  const summary = first === -1 ? [] : lines.slice(0, first).filter(Boolean)
  const sections: Array<{ title?: string, lines: string[] }> = []
  for (const line of first === -1 ? lines : lines.slice(first)) {
    if (line.startsWith('==> ')) sections.push({ title: line.slice(4), lines: [] })
    else (sections.at(-1) ?? sections[sections.push({ lines: [] }) - 1]!).lines.push(line)
  }
  for (const section of sections) {
    while (section.lines.at(-1) === '') section.lines.pop()
  }
  const errors = sections.find(section => section.title === 'Errors')
  const output = sections.filter(section => section !== errors && section.lines.length)
  return { summary, errors: errors?.lines ?? [], output }
})

const wrap = ref(true)
const { copy, copied } = useClipboard()

const scroller = useTemplateRef('scroller')
const following = ref(true)
watch(() => props.log, async () => {
  await nextTick()
  if (props.live && following.value && scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}, { immediate: true })
function onScroll() {
  const el = scroller.value
  if (el) following.value = el.scrollHeight - el.scrollTop - el.clientHeight < 24
}

const toneClass: Record<Tone, string> = {
  error: 'text-error bg-error/10',
  warning: 'text-warning',
  default: 'text-default'
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <UAlert
      v-if="parsed.summary.length"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-x"
      :title="parsed.summary[0]"
      :description="parsed.summary.slice(1).join(' ') || undefined"
    />

    <div v-if="parsed.errors.length" class="rounded-md ring ring-error/30 bg-error/5">
      <p class="px-3 pt-2.5 pb-1 text-xs font-medium text-error">
        {{ parsed.errors.length === 1 ? '1 error line' : `${parsed.errors.length} error lines` }} in the whole log
      </p>
      <pre class="px-3 pb-2.5 text-xs font-mono text-error whitespace-pre-wrap break-all">{{ parsed.errors.join('\n') }}</pre>
    </div>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md ring ring-default">
      <div class="flex items-center gap-1 border-b border-default bg-elevated/50 px-2 py-1">
        <span class="px-1 text-xs text-muted truncate">{{ live ? 'Live output' : parsed.output[0]?.title ?? 'Output' }}</span>
        <span v-if="live" class="flex items-center gap-1.5 text-xs text-muted">
          <span class="size-1.5 rounded-full bg-info animate-pulse" />
          every 15s
        </span>
        <div class="ms-auto flex items-center">
          <UTooltip :text="wrap ? 'Don\'t wrap lines' : 'Wrap lines'">
            <UButton
              :icon="wrap ? 'i-lucide-wrap-text' : 'i-lucide-text'"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="wrap ? 'Don\'t wrap lines' : 'Wrap lines'"
              @click="wrap = !wrap"
            />
          </UTooltip>
          <UTooltip :text="copied ? 'Copied' : 'Copy log'">
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Copy log"
              @click="copy(log)"
            />
          </UTooltip>
        </div>
      </div>
      <div ref="scroller" class="min-h-48 max-h-[55vh] flex-1 overflow-auto bg-default py-1.5 font-mono text-xs leading-5" @scroll="onScroll">
        <template v-for="(section, s) in parsed.output" :key="s">
          <p v-if="s > 0 && section.title" class="px-3 pt-2 pb-1 text-muted">
            {{ section.title }}
          </p>
          <div v-for="(line, i) in section.lines" :key="i" class="flex px-3" :class="toneClass[tone(line)]">
            <span class="w-9 shrink-0 select-none pe-3 text-end text-dimmed tabular-nums">{{ i + 1 }}</span>
            <span :class="wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'">{{ line || ' ' }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
