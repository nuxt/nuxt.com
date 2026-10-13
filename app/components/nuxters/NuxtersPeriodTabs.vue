<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { NuxtersPeriod } from '#shared/types'

const props = defineProps<{
  /** The period on screen. */
  period: NuxtersPeriod
  /** The periods with data: rolling windows and all time get a segment, years share the last one. */
  periods: NuxtersPeriod[]
  /** The link of each period. */
  to: (period: NuxtersPeriod) => RouteLocationRaw
  /** The rank shown next to each period, if any. */
  rank?: (period: NuxtersPeriod) => number | undefined
}>()

const { format } = new Intl.NumberFormat('en-US')
const labels: Record<string, string> = { '30d': '30 days', '12m': '12 months', 'all': 'All time' }

// Links, not tabs: each period has its own URL, which works without JavaScript.
const tabs = computed(() => ['30d', '12m', 'all']
  .filter(value => props.periods.includes(value))
  .map(value => ({ value, label: labels[value], rank: props.rank?.(value), to: props.to(value) })))
const years = computed(() => props.periods.filter(value => /^\d{4}$/.test(value)))
const year = computed(() => years.value.includes(props.period) ? props.period : undefined)
const yearItems = computed(() => years.value.map((value) => {
  const rank = props.rank?.(value)
  return { label: value, rank: rank ? `#${format(rank)}` : undefined, to: props.to(value), replace: true, active: value === props.period }
}))

const segment = (active: boolean) => ['shrink-0 grow sm:grow-0 justify-center', active
  ? 'bg-default text-highlighted shadow-xs ring ring-default hover:bg-default'
  : 'text-muted hover:text-highlighted hover:bg-transparent']
</script>

<template>
  <div
    v-if="tabs.length + years.length > 1"
    role="group"
    class="flex sm:inline-flex items-center gap-0.5 rounded-lg bg-elevated/50 ring ring-default p-0.5 overflow-x-auto"
  >
    <UButton
      v-for="tab in tabs"
      :key="tab.value"
      :to="tab.to"
      replace
      color="neutral"
      variant="ghost"
      :class="segment(tab.value === period)"
      :aria-current="tab.value === period ? 'page' : undefined"
    >
      {{ tab.label }}
      <!-- The rank does not fit on small screens: pages show the current one elsewhere -->
      <span v-if="tab.rank" class="hidden sm:inline tabular-nums text-dimmed">#{{ format(tab.rank) }}</span>
    </UButton>
    <UDropdownMenu v-if="years.length" :items="yearItems" :content="{ align: 'end' }">
      <UButton
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-down"
        :class="segment(!!year)"
        :aria-current="year ? 'page' : undefined"
      >
        {{ year ?? 'Year' }}
        <span v-if="year && rank?.(year)" class="hidden sm:inline tabular-nums text-dimmed">#{{ format(rank(year)!) }}</span>
      </UButton>
      <template #item-trailing="{ item }">
        <span v-if="item.rank" class="tabular-nums text-dimmed">{{ item.rank }}</span>
      </template>
    </UDropdownMenu>
  </div>
</template>
