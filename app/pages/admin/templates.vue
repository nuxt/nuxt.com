<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TableRow, TabsItem } from '@nuxt/ui'
import { formatTimeAgo } from '@vueuse/core'
import type { TemplateCheckRow, TemplateCheckRunSummary } from '#shared/types'

definePageMeta({
  layout: 'dashboard',
  middleware: 'admin'
})

useSeoMeta({ title: 'Templates' })

const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const { copy } = useClipboard()
const { data, refresh } = await useFetch<{ runs: TemplateCheckRunSummary[], lastRun: TemplateCheckRunSummary | null, rows: TemplateCheckRow[] }>('/api/admin/templates/checks', {
  default: () => ({ runs: [], lastRun: null, rows: [] })
})
const rows = computed(() => data.value.rows)
const runs = computed(() => data.value.runs)
const active = computed(() => runs.value.length > 0)
const totals = computed(() => runs.value.reduce((sum, run) => ({
  total: sum.total + run.total,
  done: sum.done + run.done,
  running: sum.running + run.running,
  queued: sum.queued + run.queued
}), { total: 0, done: 0, running: 0, queued: 0 }))

const { pause, resume } = useIntervalFn(() => refresh(), 3000, { immediate: false })
watch(active, value => value ? resume() : pause(), { immediate: true })

type Filter = 'all' | 'checking' | 'passed' | 'failed' | 'unchecked'
const filter = ref<Filter>('all')
const search = ref('')
const searchInput = useTemplateRef('searchInput')
const matches: Record<Filter, (row: TemplateCheckRow) => boolean> = {
  all: () => true,
  checking: row => row.state !== 'idle',
  passed: row => row.status === 'passed',
  failed: row => row.status === 'failed',
  unchecked: row => !row.status
}
const tabs = computed<TabsItem[]>(() => ([['all', 'All'], ['passed', 'Passing'], ['failed', 'Failing'], ['unchecked', 'Not checked'], ['checking', 'Checking']] as const)
  .map(([value, label]) => ({
    value,
    label,
    badge: { label: String(rows.value.filter(matches[value]).length), color: filter.value === value ? 'primary' : 'neutral', variant: 'subtle', size: 'sm' }
  })))
const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  return rows.value.filter(row => matches[filter.value](row) && (!query || row.name.toLowerCase().includes(query) || row.repo.toLowerCase().includes(query)))
})

const environment = useRequestURL().hostname === 'nuxt.com' ? 'production' : 'preview'
const runUrl = (runId?: string | null) => runId && !import.meta.dev ? `https://vercel.com/nuxt-js/nuxt/workflows/runs/${runId}?environment=${environment}` : undefined

const pending = ref<string>()
async function act(key: string, request: () => Promise<unknown>, error: string) {
  pending.value = key
  try {
    await request()
    await refresh()
  } catch (err: any) {
    toast.add({ title: error, description: err?.data?.message ?? err?.message, color: 'error', icon: 'i-lucide-circle-x' })
  } finally {
    pending.value = undefined
  }
}
const plural = (count: number) => `${count} ${count === 1 ? 'template' : 'templates'}`
const check = (body: { slugs?: string[], failing?: boolean }, key: string) => act(key, async () => {
  const result = await $fetch('/api/admin/templates/checks', { method: 'POST', body })
  const skipped = result.skipped.length ? `${plural(result.skipped.length)} already being checked.` : undefined
  if (result.queued.length) toast.add({ title: `Checking ${plural(result.queued.length)}`, description: skipped, icon: 'i-lucide-play' })
  else toast.add({ title: 'Nothing to check', description: skipped, icon: 'i-lucide-info' })
}, 'Could not start the check')
const stop = (slugs?: string[]) => act(slugs ? `stop:${slugs.join()}` : 'stop', () => $fetch<{ stopped: string[] }>('/api/admin/templates/stop', { method: 'POST', body: { slugs } }), 'Could not stop the check')

const rowSelection = ref<Record<string, boolean>>({})
const checked = computed(() => rows.value.filter(row => rowSelection.value[row.slug]))
const checkedBusy = computed(() => checked.value.filter(row => row.state !== 'idle'))
const clearChecked = () => (rowSelection.value = {})
const checkSelected = () => check({ slugs: checked.value.map(row => row.slug) }, 'selected').then(clearChecked)
const stopSelected = () => stop(checkedBusy.value.map(row => row.slug)).then(clearChecked)

const selectedSlug = ref<string>()
const selected = computed(() => rows.value.find(row => row.slug === selectedSlug.value))
const detailsOpen = computed({
  get: () => !!selectedSlug.value,
  set: (open) => { if (!open) selectedSlug.value = undefined }
})
function move(offset: number) {
  const list = visible.value
  if (!list.length) return
  const index = list.findIndex(row => row.slug === selectedSlug.value)
  selectedSlug.value = list[Math.min(list.length - 1, Math.max(0, index === -1 ? 0 : index + offset))]!.slug
}

defineShortcuts({
  '/': () => searchInput.value?.inputRef?.focus(),
  'j': () => move(1),
  'k': () => move(-1),
  'arrowdown': { usingInput: false, handler: () => detailsOpen.value && move(1) },
  'arrowup': { usingInput: false, handler: () => detailsOpen.value && move(-1) }
})

function rowActions(row: TemplateCheckRow): DropdownMenuItem[][] {
  return [[
    { label: 'Details', icon: 'i-lucide-panel-right-open', onSelect: () => (selectedSlug.value = row.slug) },
    row.state === 'idle'
      ? { label: row.status ? 'Check again' : 'Check', icon: 'i-lucide-refresh-cw', onSelect: () => check({ slugs: [row.slug] }, row.slug) }
      : { label: 'Stop', icon: 'i-lucide-square', color: 'error', onSelect: () => stop([row.slug]) }
  ], [
    { label: 'Repository', icon: 'i-simple-icons-github', to: row.repoUrl, target: '_blank' },
    { label: 'Copy slug', icon: 'i-lucide-copy', onSelect: () => copy(row.slug) },
    ...(row.error ? [{ label: 'Copy error', icon: 'i-lucide-clipboard-x', onSelect: () => copy(row.error!) }] : []),
    ...(runUrl(row.runId) ? [{ label: 'Workflow run', icon: 'i-lucide-workflow', to: runUrl(row.runId), target: '_blank' }] : [])
  ]]
}

const runActions = computed<DropdownMenuItem[]>(() => [
  { label: 'Check all templates', icon: 'i-lucide-play', onSelect: () => check({}, 'all') },
  { label: 'Check failing templates', icon: 'i-lucide-rotate-ccw', onSelect: () => check({ failing: true }, 'failing') },
  ...(active.value ? [{ label: runs.value.length > 1 ? `Stop the ${runs.value.length} runs` : 'Stop the run', icon: 'i-lucide-square', color: 'error' as const, onSelect: () => stop() }] : [])
])

/** Right-click: the row, then the selection it belongs to, then whole runs. */
const contextRow = ref<TemplateCheckRow>()
const contextItems = computed<DropdownMenuItem[][]>(() => {
  const row = contextRow.value
  if (!row) return [runActions.value]
  const [own, links] = rowActions(row)
  const inSelection = rowSelection.value[row.slug] && checked.value.length > 1
  return [
    [{ type: 'label', label: row.name }, ...own!],
    ...(inSelection
      ? [[
          { label: `Check ${checked.value.length} selected`, icon: 'i-lucide-list-checks', onSelect: checkSelected },
          ...(checkedBusy.value.length ? [{ label: `Stop ${checkedBusy.value.length} selected`, icon: 'i-lucide-square', color: 'error' as const, onSelect: stopSelected }] : [])
        ]]
      : [[{ label: rowSelection.value[row.slug] ? 'Unselect' : 'Select', icon: 'i-lucide-square-check', onSelect: () => (rowSelection.value = { ...rowSelection.value, [row.slug]: !rowSelection.value[row.slug] }) }]]),
    runActions.value,
    links!
  ]
})

const fixed = (width: string) => ({ class: { th: width, td: width } })
const columns: TableColumn<TemplateCheckRow>[] = [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsSomeRowsSelected() ? 'indeterminate' : table.getIsAllRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllRowsSelected(!!value),
      'aria-label': 'Select all'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'onClick': (event: Event) => event.stopPropagation(),
      'aria-label': `Select ${row.original.name}`
    }),
    meta: fixed('w-10')
  },
  { accessorKey: 'name', header: 'Template' },
  { id: 'status', header: 'Status', meta: fixed('w-48') },
  { accessorKey: 'nuxt', header: 'Nuxt', meta: fixed('w-20') },
  { id: 'live', header: 'Live preview', meta: fixed('w-32') },
  { accessorKey: 'checkedAt', header: 'Last checked', meta: fixed('w-32') },
  { id: 'actions', meta: fixed('w-14') }
]
const tableMeta = computed(() => ({
  class: { tr: (row: TableRow<TemplateCheckRow>) => row.original.slug === selectedSlug.value ? 'bg-elevated/60' : '' }
}))

const progress = computed(() => totals.value.total ? Math.round(totals.value.done / totals.value.total * 100) : 0)
const startedBy = (summary: TemplateCheckRunSummary) => summary.trigger === 'cron' ? 'the daily cron' : summary.trigger === 'task' ? 'the CLI' : summary.startedBy ?? 'an admin'
const timeAgo = (date: string) => formatTimeAgo(new Date(date))
</script>

<template>
  <UDashboardPanel id="templates" class="min-h-0" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar title="Templates" class="bg-default sm:px-4">
        <template #right>
          <div class="hidden md:flex w-80 items-center justify-end gap-2.5 text-sm">
            <template v-if="active">
              <UTooltip>
                <div class="flex items-center gap-2.5">
                  <UIcon name="i-lucide-loader-circle" class="size-4 shrink-0 text-info animate-spin" />
                  <span class="text-highlighted tabular-nums whitespace-nowrap">{{ totals.done }} of {{ totals.total }} checked</span>
                  <UProgress :model-value="progress" size="sm" class="w-24" />
                </div>
                <template #content>
                  <div class="flex flex-col gap-1 py-0.5 text-xs">
                    <span v-for="run in runs" :key="run.id">
                      {{ run.done }}/{{ run.total }} · {{ run.running }} running, {{ run.queued }} queued · by {{ startedBy(run) }} {{ timeAgo(run.startedAt) }}
                    </span>
                  </div>
                </template>
              </UTooltip>
              <UTooltip :text="runs.length > 1 ? `Stop the ${runs.length} runs` : 'Stop the run'">
                <UButton
                  icon="i-lucide-square"
                  color="error"
                  variant="soft"
                  size="sm"
                  aria-label="Stop all"
                  :loading="pending === 'stop'"
                  @click="stop()"
                />
              </UTooltip>
            </template>
            <span v-else-if="data.lastRun" class="text-muted truncate">
              Last run {{ data.lastRun.state === 'stopped' ? 'stopped' : 'finished' }} {{ timeAgo(data.lastRun.finishedAt ?? data.lastRun.startedAt) }}
            </span>
          </div>
          <UTooltip text="Check the templates that fail or were never checked">
            <UButton
              label="Check failing"
              color="neutral"
              variant="outline"
              :disabled="!rows.some(row => row.status !== 'passed' && row.state === 'idle')"
              :loading="pending === 'failing'"
              @click="check({ failing: true }, 'failing')"
            />
          </UTooltip>
          <UTooltip text="Install, build and start every template in a fresh sandbox. Templates already being checked are skipped.">
            <UButton label="Check all" icon="i-lucide-play" :loading="pending === 'all'" @click="check({}, 'all')" />
          </UTooltip>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="sm:px-4 items-stretch" :ui="{ left: 'items-stretch', right: 'items-center' }">
        <template #left>
          <UTabs
            v-model="filter"
            :items="tabs"
            :content="false"
            variant="link"
            size="sm"
            class="-ms-2.5"
            :ui="{ list: 'h-full p-0 border-0 gap-1', trigger: 'h-full px-2.5', indicator: '-bottom-px' }"
          />
        </template>
        <template #right>
          <div v-if="checked.length" class="flex items-center gap-1.5">
            <span class="text-sm text-muted tabular-nums whitespace-nowrap">{{ checked.length }} selected</span>
            <UTooltip text="Check the selected templates in a new run">
              <UButton
                label="Check"
                icon="i-lucide-play"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="pending === 'selected'"
                @click="checkSelected"
              />
            </UTooltip>
            <UTooltip v-if="checkedBusy.length" text="Stop the selected templates that are queued or running">
              <UButton
                label="Stop"
                icon="i-lucide-square"
                color="error"
                variant="soft"
                size="sm"
                @click="stopSelected"
              />
            </UTooltip>
            <UTooltip text="Clear selection">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Clear selection"
                @click="clearChecked"
              />
            </UTooltip>
          </div>
          <UInput
            ref="searchInput"
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search templates"
            size="sm"
            class="w-56"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UInput>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- `UTable` takes `onContextmenu` as its row prop, so the menu listens on a wrapper the event bubbles to. -->
      <UContextMenu :items="contextItems" :ui="{ content: 'min-w-52' }" @update:open="open => !open && (contextRow = undefined)">
        <div class="min-h-full">
          <UTable
            v-model:row-selection="rowSelection"
            :data="visible"
            :columns="columns"
            :meta="tableMeta"
            :get-row-id="row => row.slug"
            :on-select="(_, row) => (selectedSlug = row.original.slug)"
            :on-contextmenu="(_, row) => (contextRow = row.original)"
            sticky="header"
            empty="No templates match."
            :ui="{
              base: 'table-fixed',
              thead: '[&>tr]:bg-elevated/50',
              tr: 'cursor-pointer hover:bg-elevated/30',
              td: 'py-2.5 whitespace-nowrap'
            }"
          >
            <template #name-cell="{ row }">
              <div class="flex min-w-0 items-baseline gap-2">
                <span class="truncate font-medium text-highlighted">{{ row.original.name }}</span>
                <span class="hidden lg:inline truncate text-xs text-muted">{{ row.original.repo }}</span>
              </div>
            </template>
            <template #live-header>
              <span class="inline-flex items-center gap-1">
                Live preview
                <UTooltip text="Templates that run without environment variables are snapshotted when they pass, so visitors can try them in seconds. A failing template has no live preview until it passes again.">
                  <UIcon name="i-lucide-circle-help" class="size-3.5 text-dimmed" />
                </UTooltip>
              </span>
            </template>
            <template #status-cell="{ row }">
              <UTooltip
                v-if="row.original.error"
                :text="row.original.error"
                :content="{ side: 'bottom', align: 'start' }"
                :ui="{ content: 'max-w-md h-auto', text: 'whitespace-normal break-words font-mono' }"
              >
                <AdminTemplateCheckStatus :row="row.original" />
              </UTooltip>
              <AdminTemplateCheckStatus v-else :row="row.original" />
            </template>
            <template #nuxt-cell="{ row }">
              <span class="font-mono text-sm" :class="row.original.nuxt ? 'text-default' : 'text-dimmed'">{{ row.original.nuxt ?? '—' }}</span>
            </template>
            <template #live-cell="{ row }">
              <span v-if="!row.original.live" class="text-sm text-dimmed">Needs env vars</span>
              <span v-else-if="row.original.status === 'passed' && row.original.hasSnapshot" class="inline-flex items-center gap-1.5 text-sm">
                <UIcon name="i-lucide-play" class="size-3.5 text-success" />On
              </span>
              <span v-else class="text-sm text-muted">Off</span>
            </template>
            <template #checkedAt-cell="{ row }">
              <UTooltip v-if="row.original.checkedAt" :text="`${new Date(row.original.checkedAt).toLocaleString()}${row.original.seconds ? `, took ${formatCheckDuration(row.original.seconds)}` : ''}`">
                <span class="text-sm text-muted">{{ timeAgo(row.original.checkedAt) }}</span>
              </UTooltip>
              <span v-else class="text-sm text-dimmed">Never</span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex justify-end" @click.stop>
                <UDropdownMenu :items="rowActions(row.original)" :content="{ align: 'end' }" :ui="{ content: 'min-w-44' }">
                  <UButton
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Actions"
                    :loading="pending === row.original.slug || pending === `stop:${row.original.slug}`"
                  />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>
        </div>
      </UContextMenu>

      <AdminTemplateCheck
        v-model:open="detailsOpen"
        :row="selected"
        :run-url="runUrl(selected?.runId)"
        @recheck="slug => check({ slugs: [slug] }, slug)"
        @stop="slug => stop([slug])"
        @move="move"
      />
    </template>
  </UDashboardPanel>
</template>
