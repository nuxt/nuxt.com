<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { TabsItem } from '@nuxt/ui'
import type { NuxtersPeriod } from '#shared/types'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The period on screen. */
  period: NuxtersPeriod
  /** The periods with data: rolling windows and all time get a tab, years share the last one. */
  periods: NuxtersPeriod[]
  /** The link of each period. */
  to: (period: NuxtersPeriod) => RouteLocationRaw
  /** The rank shown next to each period, if any. */
  rank?: (period: NuxtersPeriod) => number | undefined
}>()

const appConfig = useAppConfig()
const { format } = new Intl.NumberFormat('en-US')
const labels: Record<string, string> = { '30d': '30 days', '12m': '12 months', 'all': 'All time' }

// Follows the click right away: `period` only changes once the new page has loaded.
const selected = ref(props.period)
watch(() => props.period, (value) => {
  selected.value = value
})

const years = computed(() => props.periods.filter(value => /^\d{4}$/.test(value)))
const year = computed(() => years.value.includes(selected.value) ? selected.value : undefined)

const tabs = computed<TabsItem[]>(() => [
  ...['30d', '12m', 'all']
    .filter(value => props.periods.includes(value))
    .map(value => ({ label: labels[value], value })),
  ...(years.value.length ? [{ label: year.value ?? 'Year', value: 'year' }] : [])
])
const yearItems = computed(() => years.value.map(value => ({ label: value, value })))

const open = ref(false)

function select(value: NuxtersPeriod) {
  selected.value = value
  navigateTo(props.to(value), { replace: true })
}

// The year tab only becomes active through the picker, the model never takes it.
const tab = computed({
  get: () => year.value ? 'year' : selected.value,
  set: (value: string | number) => {
    if (value !== 'year' && value !== selected.value) select(value as NuxtersPeriod)
  }
})

/**
 * The picker follows the clicks, not the model: Reka emits a tab's value on
 * mousedown and again on focus, so a toggle off the model cancels itself.
 * The year tab toggles the picker, the others close it.
 */
function onTabsClick(event: MouseEvent) {
  const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]')
  if (!trigger) return

  const triggers = [...(trigger.closest('[role="tablist"]')?.querySelectorAll('[role="tab"]') ?? [])]
  open.value = years.value.length > 0 && triggers.indexOf(trigger) === tabs.value.length - 1 ? !open.value : false
}

// A click on the tabs must not dismiss the picker: the tab's own handler decides.
function keepOpen(event: Event) {
  if ((event.target as HTMLElement | null)?.closest?.('[data-period-tabs]')) {
    event.preventDefault()
  }
}

// Reka's single-select listbox emits undefined on a second click of the current year.
function onYear(value: unknown) {
  if (value && value !== selected.value) select(value as NuxtersPeriod)
  open.value = false
}

function rankOf(value: string) {
  const rank = value === 'year' ? year.value && props.rank?.(year.value) : props.rank?.(value)
  return rank ? `#${format(rank)}` : undefined
}
</script>

<template>
  <!-- The tabs are the anchor, not the trigger: only the year tab opens the picker -->
  <UPopover
    v-if="tabs.length + years.length > 1"
    v-model:open="open"
    :content="{ align: 'end', onInteractOutside: keepOpen }"
    :ui="{ content: 'min-w-40 p-1' }"
  >
    <template #anchor>
      <UTabs
        v-model="tab"
        :items="tabs"
        :content="false"
        color="neutral"
        :ui="{
          root: 'w-full sm:w-auto',
          list: 'bg-elevated/50 ring ring-default p-0.5',
          indicator: 'bg-default inset-y-0.5',
          trigger: 'data-[state=active]:text-highlighted in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-default'
        }"
        data-period-tabs
        v-bind="$attrs"
        @click="onTabsClick"
      >
        <template #trailing="{ item }">
          <!-- The rank does not fit on small screens: pages show the current one elsewhere -->
          <span v-if="rankOf(String(item.value))" class="hidden sm:inline tabular-nums text-dimmed">{{ rankOf(String(item.value)) }}</span>
          <UIcon
            v-if="item.value === 'year'"
            :name="appConfig.ui.icons.chevronDown"
            :class="['size-4 shrink-0 transition-transform duration-200', open && 'rotate-180']"
          />
        </template>
      </UTabs>
    </template>

    <template #content>
      <UListbox
        :model-value="year"
        :items="yearItems"
        value-key="value"
        highlight-on-hover
        :ui="{ root: 'ring-0 rounded-none', content: 'max-h-72', group: 'p-0' }"
        aria-label="Year"
        @update:model-value="onYear"
      >
        <template #item-trailing="{ item }">
          <span v-if="rankOf(item.value)" class="tabular-nums text-dimmed">{{ rankOf(item.value) }}</span>
        </template>
      </UListbox>
    </template>
  </UPopover>
</template>
