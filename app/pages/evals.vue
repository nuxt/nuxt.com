<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { joinURL } from 'ufo'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})

// Types
interface EvalResultItem {
  evalPath: string
  result: {
    success: boolean
    duration: number
    evalPath: string
    timestamp: string
  }
}

interface Experiment {
  name: string
  timestamp: string
  modelName: string
  agentHarness: string
}

interface AgentResultsData {
  metadata: {
    exportedAt: string
    experiments: Experiment[]
  }
  results: Record<string, EvalResultItem[]>
}

interface ModelRow {
  model: string
  agent: string
  totalEvals: number
  successRate: number
  evals: EvalResultItem[]
}

const { url } = useSiteConfig()

const [{ data: page }, { data: rawData }] = await Promise.all([
  useAsyncData('evals', () => queryCollection('evals').first()),
  useAsyncData('agent-results', () => $fetch<AgentResultsData>(joinURL(url, '/agent-results.json')))
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
if (!rawData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Data not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', { title, description })

// Build agent map from experiments
const agentMap = computed(() => {
  const map: Record<string, string> = {}
  if (!rawData.value?.metadata?.experiments) return map
  for (const exp of rawData.value.metadata.experiments) {
    map[exp.modelName] = exp.agentHarness
  }
  return map
})

// Process results into table rows
const allResults = computed<ModelRow[]>(() => {
  if (!rawData.value?.results) return []
  const rows: ModelRow[] = []
  for (const [modelName, evals] of Object.entries(rawData.value.results)) {
    const successes = evals.filter(e => e.result.success).length
    rows.push({
      model: modelName,
      agent: agentMap.value[modelName] || 'Unknown',
      totalEvals: evals.length,
      successRate: Math.round((successes / evals.length) * 100),
      evals
    })
  }
  return rows.sort((a, b) => b.successRate - a.successRate)
})

// Agent filter
const agents = computed(() => {
  return [...new Set(allResults.value.map(r => r.agent))]
})
const selectedAgents = ref<string[]>([])

const filteredResults = computed(() => {
  if (selectedAgents.value.length === 0) {
    return allResults.value
  }
  return allResults.value.filter(r => selectedAgents.value.includes(r.agent))
})

// Format exported date
const formattedDate = computed(() => {
  if (!rawData.value?.metadata?.exportedAt) return ''
  const date = new Date(rawData.value.metadata.exportedAt)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

// Model icon mapping
function getModelIcon(model: string): string {
  const lower = model.toLowerCase()
  if (lower.includes('claude')) return 'i-simple-icons-anthropic'
  if (lower.includes('gpt') || lower.includes('codex')) return 'i-simple-icons-openai'
  if (lower.includes('gemini')) return 'i-simple-icons-googlegemini'
  if (lower.includes('deepseek')) return 'i-ri-deepseek-fill'
  if (lower.includes('devstral')) return 'i-simple-icons-mistralai'
  if (lower.includes('minimax')) return 'i-simple-icons-minimax'
  return 'i-lucide-sparkles'
}

// Format duration from ms to seconds
function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`
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
      }
    })
  },
  {
    accessorKey: 'model',
    header: 'Model',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, { name: getModelIcon(row.original.model), class: 'size-4 shrink-0' }),
      h('span', {}, row.original.model)
    ])
  },
  {
    accessorKey: 'agent',
    header: 'Agent'
  },
  {
    accessorKey: 'totalEvals',
    header: 'Total Evals',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    }
  },
  {
    accessorKey: 'successRate',
    header: 'Success Rate',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right'
      }
    },
    cell: ({ row }) => h('span', {}, `${row.original.successRate}%`)
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
    header: 'Score',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    },
    cell: ({ row }) => h(UBadge, {
      color: row.original.result.success ? 'success' : 'error',
      variant: 'subtle'
    }, () => row.original.result.success ? 'Pass' : 'Fail')
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
    cell: ({ row }) => h('span', {}, formatDuration(row.original.result.duration))
  }
]
</script>

<template>
  <div v-if="page && rawData">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :ui="{
        title: 'text-4xl sm:text-5xl lg:text-6xl font-bold',
        description: 'max-w-2xl mx-auto text-pretty',
        links: 'items-center'
      }"
    >
      <template #links>
        <UButton
          :to="page.githubUrl"
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
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold">
            Agent Performance Results
          </h2>

          <USelectMenu
            v-model="selectedAgents"
            :items="agents"
            multiple
            placeholder="All Agents"
            color="neutral"
            variant="subtle"
            class="w-52 bg-elevated/50 hover:bg-elevated data-[state=open]:bg-elevated group"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          />
        </div>

        <UTable
          v-model:expanded="expanded"
          :data="filteredResults"
          :columns="columns"
          :ui="{
            thead: '[&>tr]:bg-elevated/50 border-b border-default',
            tr: 'py-2.5 peer peer-data-[expanded=true]:[&>td]:p-4!',
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
      </UContainer>
    </UPageBody>
  </div>
</template>
