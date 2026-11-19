<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import rawData from '~~/public/agent-results.json'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

// Types
interface EvalResultItem {
  evalPath: string
  // A current model hasn't run this eval yet; it counts as not passed.
  notAvailable?: boolean
  costUsd?: number
  result: {
    success: boolean
    duration: number
    evalPath: string
    timestamp: string
    firstRunSuccess?: boolean
    passedRuns?: number
    totalRuns?: number
    passRate?: number
  }
}

interface Experiment {
  name: string
  timestamp: string
  modelName: string
  agentHarness: string
  avgDuration?: number
  avgCostUsd?: number
  passAt1?: number
  avgPassRate?: number
  // 1: current, rerun whenever the evals change. 2: previously measured.
  tier?: number
}

interface ModelRow {
  model: string
  agent: string
  timestamp: string
  totalEvals: number
  successRate: number
  passAt1?: number
  avgDuration: number
  avgCost?: number
  tier: 1 | 2
  evals: EvalResultItem[]
}

const { data: page } = await useAsyncData('evals', () => useContent('site').get('/evals'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// Data files: the document's fields live under `data`.
const pageData = computed(() => page.value!.data)

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  title,
  description
})

// Build experiment map by name
const experimentMap = computed(() => {
  const map: Record<string, Experiment> = {}
  if (!rawData?.metadata?.experiments) return map
  for (const exp of rawData.metadata.experiments) {
    map[exp.name] = exp
  }
  return map
})

// Current models first, then by success rate, first-try rate (tiebreak) and most recent run date
function sortRows(a: ModelRow, b: ModelRow): number {
  if (a.tier !== b.tier) return a.tier - b.tier
  if (b.successRate !== a.successRate) return b.successRate - a.successRate
  const aPassAt1 = a.passAt1 ?? -1
  const bPassAt1 = b.passAt1 ?? -1
  if (bPassAt1 !== aPassAt1) return bPassAt1 - aPassAt1
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
}

// Process results into table rows
const allResults = computed<ModelRow[]>(() => {
  if (!rawData?.results) return []
  const rows: ModelRow[] = []
  for (const [experimentName, evals] of Object.entries(rawData.results)) {
    const experiment = experimentMap.value[experimentName]
    const successes = evals.filter(e => e.result.success).length
    rows.push({
      model: experiment?.modelName || experimentName,
      agent: experiment?.agentHarness || 'Unknown',
      timestamp: experiment?.timestamp || '',
      totalEvals: evals.length,
      successRate: evals.length ? Math.round((successes / evals.length) * 100) : 0,
      passAt1: experiment?.passAt1,
      avgDuration: experiment?.avgDuration ?? 0,
      avgCost: experiment?.avgCostUsd,
      tier: experiment?.tier === 2 ? 2 : 1,
      evals
    })
  }
  return rows.sort(sortRows)
})

// Agent filter
const agents = computed(() => {
  return [...new Set(allResults.value.map(r => r.agent))]
})
const selectedAgents = ref<string[]>([])

// Category filter
function getEvalCategory(evalPath: string): string {
  if (evalPath.startsWith('nuxt-ui-')) return 'Nuxt UI'
  if (evalPath.startsWith('nuxt-content-')) return 'Nuxt Content'
  return 'Nuxt'
}

const categories = computed(() => {
  const allEvals = allResults.value.flatMap(r => r.evals)
  return [...new Set(allEvals.map(e => getEvalCategory(e.evalPath)))].sort()
})
const selectedCategories = ref<string[]>([])

// Previously measured models are kept for reference but hidden by default
const showPrevious = ref(false)
const previousCount = computed(() => allResults.value.filter(r => r.tier === 2).length)

const filteredResults = computed(() => {
  let rows = allResults.value

  if (!showPrevious.value) {
    rows = rows.filter(r => r.tier === 1)
  }

  if (selectedAgents.value.length > 0) {
    rows = rows.filter(r => selectedAgents.value.includes(r.agent))
  }

  if (selectedCategories.value.length > 0) {
    rows = rows.map((r) => {
      const evals = r.evals.filter(e => selectedCategories.value.includes(getEvalCategory(e.evalPath)))
      const successes = evals.filter(e => e.result.success).length
      const firstTries = evals.filter(e => e.result.firstRunSuccess).length
      const measured = evals.filter(e => !e.notAvailable)
      const priced = measured.filter(e => e.costUsd != null)
      return {
        ...r,
        evals,
        totalEvals: evals.length,
        successRate: evals.length ? Math.round((successes / evals.length) * 100) : 0,
        // Recompute first-try rate from the filtered subset so the column and sort tiebreak
        // match the shown evals; keep undefined for older data that lacks firstRunSuccess.
        passAt1: r.passAt1 != null && evals.length ? firstTries / evals.length : undefined,
        // Averages are plain means over the per-eval values, so they can be recomputed
        // from the filtered subset and still match the unfiltered experiment numbers.
        avgDuration: measured.length ? measured.reduce((sum, e) => sum + e.result.duration, 0) / measured.length / 1000 : 0,
        avgCost: priced.length ? priced.reduce((sum, e) => sum + (e.costUsd ?? 0), 0) / priced.length : undefined
      }
    }).sort(sortRows)
  }

  return rows
})

// Format exported date
const formattedDate = computed(() => {
  if (!rawData?.metadata?.exportedAt) return ''
  const date = new Date(rawData.metadata.exportedAt)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

function formatShortDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Model icon mapping (matched by lowercase prefix of model name)
const modelIconMap: Record<string, string> = {
  claude: 'i-simple-icons-anthropic',
  gpt: 'i-simple-icons-openai',
  cursor: 'i-simple-icons-cursor',
  gemini: 'i-simple-icons-googlegemini',
  devstral: 'i-simple-icons-mistralai',
  minimax: 'i-simple-icons-minimax',
  kimi: 'i-simple-icons-kimi',
  deepseek: 'i-simple-icons-deepseek',
  glm: 'i-simple-icons-zdotai',
  grok: 'i-custom-grok'
}

function getModelIcon(model: string): string {
  const lower = model.toLowerCase()
  for (const [key, icon] of Object.entries(modelIconMap)) {
    if (lower.startsWith(key)) return icon
  }
  return 'i-lucide-box'
}

// Format duration from ms to seconds
function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`
}

// Format average duration (already in seconds)
function formatAvgDuration(seconds: number): string {
  if (!seconds) return '-'
  return `${seconds.toFixed(2)}s`
}

// Format cost in USD
function formatCost(usd?: number): string {
  if (usd == null) return '—'
  return `$${usd.toFixed(3)}`
}

// Column header with its definition in a tooltip
function headerWithInfo(label: string, text: string) {
  return () => h(UTooltip, { text }, () => h('span', { class: 'inline-flex items-center gap-1' }, [
    h('span', {}, label),
    h(UIcon, { name: 'i-lucide-info', class: 'size-3.5 text-dimmed' })
  ]))
}

// Expanded rows state
const expanded = ref({})

// Toggle expand on row click
function onSelect(_e: Event, row: TableRow<ModelRow>) {
  row.toggleExpanded()
}

// Table columns
const columns: TableColumn<ModelRow>[] = [
  {
    id: 'expand',
    meta: {
      class: {
        th: 'w-0',
        td: 'w-0'
      }
    },
    cell: ({ row }) => h(UButton, {
      'color': 'neutral',
      'variant': 'ghost',
      'icon': 'i-lucide-chevron-right',
      'square': true,
      'size': 'sm',
      'aria-label': 'Expand',
      'ui': {
        leadingIcon: ['transition-transform', row.getIsExpanded() ? 'duration-200 rotate-90' : '']
      },
      'onClick': (e: Event) => {
        e.stopPropagation()
        row.toggleExpanded()
      },
      'class': 'group-hover:bg-elevated'
    })
  },
  {
    accessorKey: 'model',
    header: 'Model',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, { icon: getModelIcon(row.original.model), size: 'sm', class: 'ring ring-default ring-inset' }),
      h('span', {}, row.original.model),
      row.original.tier === 2
        ? h(UTooltip, {
            text: `Previously measured on ${row.original.totalEvals} evals and not rerun since.`
          }, () => h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => formatShortDate(row.original.timestamp)))
        : null
    ])
  },
  {
    accessorKey: 'agent',
    header: 'Agent'
  },
  {
    accessorKey: 'avgDuration',
    header: headerWithInfo('Avg Duration', 'Mean time per eval.'),
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center text-muted'
      }
    },
    cell: ({ row }) => h('span', {}, formatAvgDuration(row.original.avgDuration))
  },
  {
    accessorKey: 'avgCost',
    header: headerWithInfo('Avg List Cost', 'Mean cost per eval at public list prices. A guide, not a bill.'),
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center text-muted'
      }
    },
    cell: ({ row }) => h('span', {}, formatCost(row.original.avgCost))
  },
  {
    accessorKey: 'successRate',
    header: headerWithInfo('Success Rate', 'Passed on any of 4 attempts. Not run yet counts as failed.'),
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right text-success font-medium'
      }
    },
    cell: ({ row }) => h('span', {}, `${row.original.successRate}%`)
  },
  {
    accessorKey: 'passAt1',
    header: headerWithInfo('First-Try Rate', 'Passed on the first attempt. Breaks ties.'),
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right text-muted'
      }
    },
    cell: ({ row }) => h('span', {}, row.original.passAt1 != null ? `${Math.round(row.original.passAt1 * 100)}%` : '—')
  }
]

// Expanded eval table columns
const evalColumns: TableColumn<EvalResultItem>[] = [
  {
    accessorKey: 'evalPath',
    header: 'Evaluation'
  },
  {
    id: 'score',
    header: 'Result',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    },
    cell: ({ row }) => {
      if (row.original.notAvailable) {
        return h('div', { class: 'flex items-center justify-center' }, [
          h(UTooltip, { text: 'Not run yet. Counts as not passed.' }, () => h(UBadge, { color: 'neutral', variant: 'outline' }, () => 'N/A'))
        ])
      }
      const { success, passedRuns, totalRuns } = row.original.result
      const children = [
        h(UBadge, {
          color: success ? 'success' : 'error',
          variant: 'subtle'
        }, () => success ? 'Pass' : 'Fail')
      ]
      if (totalRuns && totalRuns > 1) {
        children.push(h(UTooltip, {
          text: `${passedRuns} of ${totalRuns} attempts passed`
        }, () => h(UBadge, {
          color: 'neutral',
          variant: 'subtle'
        }, () => `${passedRuns}/${totalRuns}`)))
      }
      return h('div', { class: 'flex items-center justify-center gap-1.5' }, children)
    }
  },
  {
    id: 'duration',
    header: 'Duration',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right'
      }
    },
    cell: ({ row }) => h('span', {}, row.original.notAvailable ? '—' : formatDuration(row.original.result.duration))
  }
]

// Previously measured rows are dimmed, and the first one gets a stronger divider
const tableMeta = {
  class: {
    tr: (row: TableRow<ModelRow>) => {
      if (row.original.tier !== 2) return ''
      const first = filteredResults.value.findIndex(r => r.tier === 2) === row.index
      return ['[&>td]:text-muted', first ? 'border-t-2 border-default' : ''].join(' ')
    }
  }
}
</script>

<template>
  <UPage v-if="pageData && rawData">
    <UPageHero
      :title="pageData.title"
      :description="pageData.description"
      :ui="{
        title: 'text-4xl sm:text-5xl lg:text-6xl font-bold',
        description: 'max-w-2xl mx-auto text-pretty',
        links: 'items-center'
      }"
    >
      <template #links>
        <UButton
          :to="pageData.githubUrl"
          icon="i-simple-icons-github"
          label="View on GitHub"
          target="_blank"
          color="neutral"
          variant="ghost"
        />

        <USeparator orientation="vertical" class="h-6" />

        <span class="text-sm font-medium">Last run date: <span class="text-muted font-normal">{{ formattedDate }}</span></span>
      </template>
    </UPageHero>

    <UPageBody class="mt-0">
      <UContainer class="max-w-6xl">
        <div class="flex flex-col lg:flex-row gap-y-4 items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold">
            Agent Performance Results
          </h2>

          <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
            <USwitch
              v-if="previousCount"
              v-model="showPrevious"
              :label="`Show ${previousCount} previous models`"
              class="me-2"
            />

            <USelectMenu
              v-model="selectedCategories"
              :items="categories"
              multiple
              placeholder="All Categories"
              color="neutral"
              variant="subtle"
              size="md"
              class="w-52 bg-elevated/50 hover:bg-elevated data-[state=open]:bg-elevated group"
              :ui="{
                placeholder: 'text-highlighted',
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
              }"
            />

            <USelectMenu
              v-model="selectedAgents"
              :items="agents"
              multiple
              placeholder="All Agents"
              color="neutral"
              variant="subtle"
              size="md"
              class="w-52 bg-elevated/50 hover:bg-elevated data-[state=open]:bg-elevated group"
              :ui="{
                placeholder: 'text-highlighted',
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
              }"
            />
          </div>
        </div>

        <UTable
          v-model:expanded="expanded"
          :data="filteredResults"
          :columns="columns"
          :meta="tableMeta"
          :ui="{
            thead: '[&>tr]:bg-elevated/50 border-b border-default',
            tr: 'py-2.5 peer peer-data-[expanded=true]:[&>td]:p-4! group transition-[background-color] cursor-default',
            td: 'py-2.5'
          }"
          class="flex-1 border border-default rounded-lg"
          @select="onSelect"
        >
          <template #expanded="{ row }">
            <UTable
              :data="row.original.evals"
              :columns="evalColumns"
              :ui="{
                thead: '[&>tr]:bg-elevated/50 border-b border-default',
                tr: 'py-2.5',
                td: 'py-2.5'
              }"
              class="flex-1 border border-default rounded-lg"
            />
          </template>
        </UTable>

        <p class="mt-4 text-sm text-dimmed text-pretty">
          Current models are rerun whenever the evals change. Previous models keep their last results, dated by their last run.
          Hover a column header for its definition, or expand a row for per-eval results.
        </p>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
