<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import type { TemplateCheckRow } from '#shared/types'

const props = defineProps<{
  row?: TemplateCheckRow
  runUrl?: string
}>()
const emit = defineEmits<{ recheck: [slug: string], stop: [slug: string], move: [offset: number] }>()
const open = defineModel<boolean>('open', { default: false })

const now = useNow({ interval: 1000 })
const log = ref<string | null>(null)

async function loadLog() {
  if (!open.value || !props.row) return
  const slug = props.row.slug
  const check = await $fetch(`/api/admin/templates/checks/${slug}`).catch(() => null)
  if (check && props.row?.slug === slug) log.value = check.log
}
watch([open, () => props.row?.slug], () => {
  log.value = null
  loadLog()
}, { immediate: true })
watch(() => props.row?.state, loadLog)

const running = computed(() => props.row?.state === 'running')
const { pause, resume } = useIntervalFn(loadLog, 3000, { immediate: false })
watch([open, running], ([isOpen, isRunning]) => isOpen && isRunning ? resume() : pause(), { immediate: true })

const phases = computed(() => (props.row?.phases ?? []).map(timing => ({
  ...timing,
  label: TEMPLATE_CHECK_PHASE_LABELS[timing.phase],
  current: running.value && timing.seconds === undefined,
  seconds: timing.seconds ?? (running.value ? Math.max(0, Math.round((now.value.getTime() - timing.startedAt) / 1000)) : undefined)
})))
const failedPhase = computed(() => props.row?.state === 'idle' && props.row.status === 'failed' ? props.row.step : undefined)
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="row?.name"
    :description="row?.repo"
    :content="{ onOpenAutoFocus: (event: Event) => event.preventDefault() }"
    :ui="{ content: 'sm:max-w-2xl', body: 'flex flex-col gap-6' }"
  >
    <template #actions>
      <UTooltip text="Previous" :kbds="['k']">
        <UButton icon="i-lucide-chevron-up" color="neutral" variant="ghost" aria-label="Previous template" @click="emit('move', -1)" />
      </UTooltip>
      <UTooltip text="Next" :kbds="['j']">
        <UButton icon="i-lucide-chevron-down" color="neutral" variant="ghost" aria-label="Next template" @click="emit('move', 1)" />
      </UTooltip>
    </template>

    <template #body>
      <template v-if="row">
        <dl class="grid grid-cols-[8rem_1fr] gap-y-2.5 text-sm">
          <dt class="text-muted">
            Status
          </dt>
          <dd><AdminTemplateCheckStatus :row="row" /></dd>
          <dt class="text-muted">
            Nuxt
          </dt>
          <dd class="font-mono">
            {{ row.nuxt ?? '—' }}
          </dd>
          <dt class="text-muted">
            Live preview
          </dt>
          <dd>{{ !row.live ? 'Needs environment variables' : row.status === 'passed' && row.hasSnapshot ? 'On' : row.hasSnapshot ? 'Off until it passes again' : 'Off' }}</dd>
          <dt class="text-muted">
            Last checked
          </dt>
          <dd>{{ row.checkedAt ? `${formatTimeAgo(new Date(row.checkedAt))}${row.seconds ? `, in ${formatCheckDuration(row.seconds)}` : ''}` : 'Never' }}</dd>
          <template v-if="row.status === 'failed'">
            <dt class="text-muted">
              Last passed
            </dt>
            <dd>{{ row.passedAt ? formatTimeAgo(new Date(row.passedAt)) : 'Never' }}</dd>
          </template>
        </dl>

        <section v-if="phases.length" class="flex flex-col gap-2">
          <h3 class="text-sm font-medium text-highlighted">
            {{ running ? 'Current check' : 'Last check' }}
          </h3>
          <ol class="flex flex-col rounded-md ring ring-default divide-y divide-default text-sm">
            <li v-for="phase in phases" :key="phase.phase" class="flex items-center gap-2.5 px-3 py-2">
              <UIcon v-if="phase.current" name="i-lucide-loader-circle" class="size-4 shrink-0 text-info animate-spin" />
              <UIcon v-else-if="failedPhase === phase.phase" name="i-lucide-circle-x" class="size-4 shrink-0 text-error" />
              <UIcon v-else name="i-lucide-circle-check" class="size-4 shrink-0 text-muted" />
              <span :class="phase.current ? 'text-highlighted' : 'text-default'">{{ phase.label }}</span>
              <span class="ms-auto font-mono text-xs text-muted tabular-nums">{{ phase.seconds !== undefined ? formatCheckDuration(phase.seconds) : '' }}</span>
            </li>
          </ol>
        </section>

        <section class="flex flex-col gap-2 min-h-0 flex-1">
          <h3 class="text-sm font-medium text-highlighted">
            {{ running ? 'Live log' : 'Log' }}
          </h3>
          <AdminTemplateCheckLog v-if="log" :log="log" :live="running" />
          <p v-else class="text-sm text-muted">
            {{ running ? 'Waiting for the first output…' : row.status === 'passed' ? 'Passing checks keep no log.' : 'Never checked. Check it to see its install and build output.' }}
          </p>
        </section>
      </template>
    </template>

    <template v-if="row" #footer>
      <div class="flex w-full items-center gap-2">
        <UTooltip v-if="runUrl" text="Open this check in Vercel Observability, with every step and retry">
          <UButton
            label="Workflow run"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            :to="runUrl"
            target="_blank"
          />
        </UTooltip>
        <div class="ms-auto flex gap-2">
          <UTooltip v-if="row.state !== 'idle'" text="Cancel this check and stop its sandbox. The last result stays.">
            <UButton
              label="Stop"
              icon="i-lucide-square"
              color="error"
              variant="soft"
              @click="emit('stop', row.slug)"
            />
          </UTooltip>
          <UTooltip v-else text="Install, build and start it again in a fresh sandbox">
            <UButton
              :label="row.status ? 'Check again' : 'Check'"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              @click="emit('recheck', row.slug)"
            />
          </UTooltip>
        </div>
      </div>
    </template>
  </USlideover>
</template>
