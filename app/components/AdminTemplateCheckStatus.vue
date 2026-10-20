<script setup lang="ts">
import type { TemplateCheckRow } from '#shared/types'

const props = defineProps<{ row: TemplateCheckRow }>()

const now = useNow({ interval: 1000 })
const elapsed = computed(() => props.row.startedAt ? Math.max(0, Math.round((now.value.getTime() - new Date(props.row.startedAt).getTime()) / 1000)) : 0)
</script>

<template>
  <span class="inline-flex items-center gap-2 text-sm whitespace-nowrap">
    <template v-if="row.state === 'running'">
      <UIcon name="i-lucide-loader-circle" class="size-3.5 shrink-0 text-info animate-spin" />
      <span class="text-highlighted">{{ row.phase ? TEMPLATE_CHECK_PHASE_LABELS[row.phase] : 'Starting' }}</span>
      <span class="font-mono text-xs text-muted tabular-nums">{{ formatCheckDuration(elapsed) }}</span>
    </template>
    <template v-else-if="row.state === 'queued'">
      <UIcon name="i-lucide-clock" class="size-3.5 shrink-0 text-muted" />
      <span class="text-muted">Queued</span>
    </template>
    <template v-else-if="row.status === 'passed'">
      <span class="size-2 shrink-0 rounded-full bg-success" />
      Passes
    </template>
    <template v-else-if="row.status === 'failed'">
      <span class="size-2 shrink-0 rounded-full bg-error" />
      Fails at {{ row.step }}
    </template>
    <template v-else>
      <span class="size-2 shrink-0 rounded-full bg-accented" />
      <span class="text-muted">Not checked</span>
    </template>
  </span>
</template>
