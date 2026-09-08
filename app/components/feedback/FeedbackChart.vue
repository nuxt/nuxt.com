<script setup lang="ts">
type PageAnalytic = {
  path: string
  total: number
  positive: number
  negative: number
  averageScore: number
  positivePercentage: number
  feedback: any[]
  lastFeedback: any
  createdAt: Date
  updatedAt: Date
}

interface Props {
  pageAnalytics: PageAnalytic[]
}

const props = defineProps<Props>()
const { dateRange } = useDateRange()

const chartType = ref<'line' | 'compare' | 'overall'>('line')

const selectedPagePaths = ref<string[]>([])
const showPageSelector = ref(false)
const pageSearchQuery = ref('')

const hasValidData = computed(() => {
  return props.pageAnalytics && props.pageAnalytics.length > 0 && props.pageAnalytics.some(p => p && p.total > 0)
})

const availablePages = computed(() => {
  if (!props.pageAnalytics) return []

  const pages = props.pageAnalytics
    .filter(p => p && p.total > 0)
    .sort((a, b) => b.total - a.total)
    .map(page => ({
      path: page.path,
      title: page.lastFeedback?.title || page.path,
      total: page.total,
      score: page.averageScore
    }))

  if (!pageSearchQuery.value.trim()) {
    return pages
  }

  const searchTerm = pageSearchQuery.value.toLowerCase().trim()
  return pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm)
    || page.path.toLowerCase().includes(searchTerm)
  )
})

watch(() => props.pageAnalytics, (analytics) => {
  if (selectedPagePaths.value.length === 0 && analytics && analytics.length > 0) {
    const validAnalytics = analytics.filter(p => p && p.total > 0)
    if (validAnalytics.length > 0) {
      const topPages = validAnalytics
        .sort((a, b) => b.total - a.total)
        .slice(0, Math.min(5, validAnalytics.length))
      selectedPagePaths.value = topPages.map(p => p.path)
    }
  }
}, { immediate: true })

const overallChartData = computed(() => {
  const data: any[] = []
  const endDate = dateRange.value.end
  const startDate = dateRange.value.start

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const dailyScores: Record<string, number[]> = {}

  if (hasValidData.value && props.pageAnalytics) {
    for (const page of props.pageAnalytics) {
      if (!page || !page.feedback) continue

      for (const feedback of page.feedback) {
        const feedbackDate = new Date(feedback.createdAt)

        if (feedbackDate >= startDate && feedbackDate <= endDate) {
          const dateStr = feedbackDate.toISOString().split('T')[0]
          if (!dailyScores[dateStr]) {
            dailyScores[dateStr] = []
          }

          const ratingScore = FEEDBACK_OPTIONS.find(opt => opt.value === feedback.rating)?.score || 0
          dailyScores[dateStr].push(ratingScore)
        }
      }
    }
  }

  let lastKnownValue = 0

  for (let i = daysDiff - 1; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const entry: any = {
      date: dateStr,
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    if (hasValidData.value && dailyScores[dateStr] && dailyScores[dateStr].length > 0) {
      const dayAverage = dailyScores[dateStr].reduce((sum, score) => sum + score, 0) / dailyScores[dateStr].length
      lastKnownValue = Math.min(4.0, Number(dayAverage.toFixed(2)))
    }

    entry.average = lastKnownValue

    data.push(entry)
  }

  return data
})

const timeBasedChartData = computed(() => {
  const data: any[] = []
  const endDate = dateRange.value.end
  const startDate = dateRange.value.start

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (!hasValidData.value || selectedPagePaths.value.length === 0 || !props.pageAnalytics) {
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        placeholder: 0
      })
    }
    return data
  }

  const dailyScores: Record<string, Record<string, number[]>> = {}

  const selectedPages = props.pageAnalytics.filter(p => p && selectedPagePaths.value.includes(p.path))

  for (const page of selectedPages) {
    if (!page || !page.feedback) continue

    const pageKey = page.path.split('/').pop()?.replace(/[^a-z0-9]/gi, '') || 'page'

    for (const feedback of page.feedback) {
      const feedbackDate = new Date(feedback.createdAt)

      if (feedbackDate >= startDate && feedbackDate <= endDate) {
        const dateStr = feedbackDate.toISOString().split('T')[0]
        if (!dailyScores[dateStr]) {
          dailyScores[dateStr] = {}
        }
        if (!dailyScores[dateStr][pageKey]) {
          dailyScores[dateStr][pageKey] = []
        }

        const ratingScore = FEEDBACK_OPTIONS.find(opt => opt.value === feedback.rating)?.score || 0
        dailyScores[dateStr][pageKey].push(ratingScore)
      }
    }
  }

  const lastKnownValues: Record<string, number> = {}

  for (let i = daysDiff - 1; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const entry: any = {
      date: dateStr,
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    for (const page of selectedPages) {
      if (!page) continue

      const pageKey = page.path.split('/').pop()?.replace(/[^a-z0-9]/gi, '') || 'page'

      if (dailyScores[dateStr] && dailyScores[dateStr][pageKey] && dailyScores[dateStr][pageKey].length > 0) {
        const dayAverage = dailyScores[dateStr][pageKey].reduce((sum, score) => sum + score, 0) / dailyScores[dateStr][pageKey].length
        lastKnownValues[pageKey] = Math.min(4.0, Number(dayAverage.toFixed(2)))
      }

      entry[pageKey] = lastKnownValues[pageKey] || 0
    }

    data.push(entry)
  }

  return data
})

const comparisonChartData = computed(() => {
  if (!hasValidData.value || selectedPagePaths.value.length === 0 || !props.pageAnalytics) {
    return [{ page: 'No Data', positive: 0, negative: 0 }]
  }

  return props.pageAnalytics
    .filter(p => p && selectedPagePaths.value.includes(p.path))
    .map((page) => {
      const title = page.lastFeedback?.title || page.path
      const shortTitle = title.length > 15 ? title.substring(0, 15) + '...' : title

      return {
        page: shortTitle,
        positive: page.positive,
        negative: page.negative
      }
    })
})

const chartData = computed(() => {
  if (chartType.value === 'compare') return comparisonChartData.value
  if (chartType.value === 'overall') return overallChartData.value
  return timeBasedChartData.value
})

const chartCategories = computed(() => {
  if (!hasValidData.value) {
    return {
      placeholder: {
        name: 'No Data Available',
        color: '#6b7280'
      }
    }
  }

  if (chartType.value === 'compare') {
    return {
      positive: {
        name: 'Positive',
        color: 'var(--ui-success)'
      },
      negative: {
        name: 'Negative',
        color: 'var(--ui-error)'
      }
    }
  }

  if (chartType.value === 'overall') {
    return {
      average: {
        name: 'Overall Rating',
        color: '#3b82f6'
      }
    }
  }

  if (selectedPagePaths.value.length === 0 || !props.pageAnalytics) {
    return {
      placeholder: {
        name: 'No Pages Selected',
        color: '#6b7280'
      }
    }
  }

  const selectedPages = props.pageAnalytics.filter(p => p && selectedPagePaths.value.includes(p.path))
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  return selectedPages.reduce((acc, page, index) => {
    if (!page) return acc

    const key = page.path.split('/').pop()?.replace(/[^a-z0-9]/gi, '') || 'page'
    const title = page.lastFeedback?.title || page.path
    acc[key] = {
      name: title.length > 25 ? title.substring(0, 25) + '...' : title,
      color: colors[index % colors.length]
    }
    return acc
  }, {} as Record<string, { name: string, color: string }>)
})

const xFormatter = (index: number) => {
  if (chartType.value === 'compare') {
    return comparisonChartData.value[index]?.page || ''
  }
  if (chartType.value === 'overall') {
    return overallChartData.value[index]?.day || ''
  }
  return timeBasedChartData.value[index]?.day || ''
}

const yFormatter = (value: number) => {
  if (chartType.value === 'compare') {
    return Math.round(value).toString()
  }
  return value === 0 ? '0' : `${Number(value).toFixed(1)}/4`
}

const dateRangeLabel = computed(() => {
  if (chartType.value === 'compare') {
    return `Selected Pages (${selectedPagePaths.value.length})`
  }

  const daysDiff = Math.ceil((dateRange.value.end.getTime() - dateRange.value.start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 7) return `Last ${daysDiff} days`
  if (daysDiff <= 31) return `Last ${daysDiff} days`
  if (daysDiff <= 93) return `Last ${Math.round(daysDiff / 30)} months`
  if (daysDiff <= 186) return `Last ${Math.round(daysDiff / 30)} months`
  return `Last ${Math.round(daysDiff / 365)} year${daysDiff > 730 ? 's' : ''}`
})

const chartTitle = computed(() => {
  switch (chartType.value) {
    case 'line':
      return 'Rating Evolution'
    case 'compare':
      return 'Page Comparison'
    case 'overall':
      return 'Overall Documentation Rating'
    default:
      return 'Rating Evolution'
  }
})

const chartDescription = computed(() => {
  switch (chartType.value) {
    case 'line':
      return 'Track selected pages satisfaction over time'
    case 'compare':
      return 'Compare feedback distribution across pages'
    case 'overall':
      return 'Global documentation satisfaction evolution'
    default:
      return 'Track selected pages satisfaction over time'
  }
})

const chartIcon = computed(() => {
  switch (chartType.value) {
    case 'line':
      return 'i-lucide-trending-up'
    case 'compare':
      return 'i-lucide-bar-chart-4'
    case 'overall':
      return 'i-lucide-activity'
    default:
      return 'i-lucide-trending-up'
  }
})

const availableChartTypes = [
  { value: 'line' as const, label: 'Line', icon: 'i-lucide-trending-up' },
  { value: 'compare' as const, label: 'Compare', icon: 'i-lucide-bar-chart-4' },
  { value: 'overall' as const, label: 'Overall', icon: 'i-lucide-activity' }
]

function togglePageSelection(pagePath: string) {
  const index = selectedPagePaths.value.indexOf(pagePath)
  if (index > -1) {
    selectedPagePaths.value.splice(index, 1)
  } else {
    selectedPagePaths.value.push(pagePath)
  }
}

function selectTopPages(count: number) {
  if (!props.pageAnalytics) return

  const pages = props.pageAnalytics
    .filter(p => p && p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, count)
  selectedPagePaths.value = pages.map(p => p.path)
}

function selectBestRatedPages(count: number) {
  if (!props.pageAnalytics) return

  const pages = props.pageAnalytics
    .filter(p => p && p.total > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, count)
  selectedPagePaths.value = pages.map(p => p.path)
}

function selectWorstPages(count: number) {
  if (!props.pageAnalytics) return

  const pages = props.pageAnalytics
    .filter(p => p && p.total > 0)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, count)
  selectedPagePaths.value = pages.map(p => p.path)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <Motion
        :key="`header-${chartType}`"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, ease: 'easeInOut' }"
        class="flex items-center gap-3"
      >
        <UIcon :name="chartIcon" class="size-6 sm:size-5 text-primary shrink-0" />
        <div class="min-w-0">
          <h3 class="text-lg font-semibold truncate">
            {{ chartTitle }}
          </h3>
          <p class="text-sm text-muted">
            {{ chartDescription }}
          </p>
        </div>
      </Motion>

      <div class="flex items-center max-sm:flex-row-reverse max-sm:justify-end gap-2 flex-wrap">
        <AnimatePresence mode="wait">
          <Motion
            v-if="chartType !== 'overall'"
            :initial="{ opacity: 0, scale: 0.9 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.9 }"
            :transition="{ duration: 0.3 }"
          >
            <UChip :text="selectedPagePaths.length" size="3xl">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-settings"
                @click="showPageSelector = true"
              />
            </UChip>
          </Motion>
        </AnimatePresence>

        <div class="flex items-center gap-1 border border-default rounded-lg p-1">
          <UButton
            v-for="type in availableChartTypes"
            :key="type.value"
            :color="chartType === type.value ? 'primary' : 'neutral'"
            :variant="chartType === type.value ? 'solid' : 'ghost'"
            size="sm"
            :icon="type.icon"
            :label="type.label"
            @click="chartType = type.value"
          />
        </div>
      </div>
    </div>

    <div class="relative rounded-xl overflow-hidden mb-8">
      <div class="dot-pattern h-[300px] -top-5 left-0 right-0" />

      <LineChart
        v-if="chartType === 'overall'"
        :data="chartData"
        :categories="chartCategories"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :x-label="dateRangeLabel"
        y-label="Rating (out of 4)"
        :show-tooltip="true"
      />

      <LineChart
        v-else-if="chartType === 'line'"
        :data="chartData"
        :categories="chartCategories"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :x-label="dateRangeLabel"
        y-label="Rating (out of 4)"
        :show-tooltip="true"
        class="min-h-[300px]"
      />

      <BarChart
        v-else-if="chartType === 'compare'"
        :data="chartData"
        :categories="chartCategories"
        :y-axis="['positive', 'negative']"
        :stacked="true"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :x-label="dateRangeLabel"
        y-label="Feedback Count"
        :height="300"
        :bar-padding="0.2"
        :y-grid-line="false"
        class="min-h-[300px]"
      />
    </div>

    <div v-if="!hasValidData" class="text-center py-4">
      <p class="text-sm text-muted">
        Chart shows no data - will display real trends once feedback is collected
      </p>
    </div>

    <UModal v-model:open="showPageSelector" :ui="{ content: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              class="absolute top-2 right-2"
              @click="showPageSelector = false"
            />
            <div class="space-y-3">
              <h3 class="text-lg font-semibold">
                Select Pages to {{ chartType === 'line' ? 'Track' : 'Compare' }}
              </h3>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm text-muted font-medium">Quick select:</span>
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  label="Best Rated 5"
                  @click="selectBestRatedPages(5)"
                />
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  label="Most Popular 5"
                  @click="selectTopPages(5)"
                />
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  label="Worst Rated 5"
                  @click="selectWorstPages(5)"
                />
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  label="Worst Rated 10"
                  @click="selectWorstPages(10)"
                />
              </div>
            </div>
          </template>

          <div class="mb-4">
            <UInput
              v-model="pageSearchQuery"
              placeholder="Search pages..."
              icon="i-lucide-search"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template v-if="pageSearchQuery?.length" #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide-circle-x"
                  aria-label="Clear input"
                  @click="pageSearchQuery = ''"
                />
              </template>
            </UInput>
          </div>

          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="page in availablePages"
              :key="page.path"
              class="flex items-center justify-between p-3 border border-default rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              :class="{ 'bg-primary/5 border-primary/20 hover:bg-primary/10': selectedPagePaths.includes(page.path) }"
              @click="togglePageSelection(page.path)"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UCheckbox
                  :model-value="selectedPagePaths.includes(page.path)"
                  @update:model-value="togglePageSelection(page.path)"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate">
                    {{ page.title }}
                  </div>
                  <code class="text-xs text-muted truncate block">{{ page.path }}</code>
                </div>
              </div>
              <div class="flex items-center gap-2 sm:gap-4 text-sm shrink-0">
                <div class="text-center">
                  <div class="font-semibold">
                    {{ page.total }}
                  </div>
                  <div class="text-muted text-xs">
                    resp.
                  </div>
                </div>
                <div class="text-center">
                  <div class="font-semibold" :class="page.score >= 3.5 ? 'text-success' : page.score >= 3.0 ? 'text-warning' : 'text-error'">
                    {{ page.score.toFixed(1) }}/4
                  </div>
                  <div class="text-muted text-xs">
                    score
                  </div>
                </div>
              </div>
            </div>

            <div v-if="availablePages.length === 0" class="text-center py-8">
              <UIcon name="i-lucide-search-x" class="size-8 text-muted mx-auto mb-2" />
              <p class="text-sm text-muted">
                No pages found matching your search
              </p>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<style>
:root {
  --vis-tooltip-background-color: rgba(255, 255, 255, 0.95) !important;
  --vis-tooltip-border-color: rgba(0, 0, 0, 0.1) !important;
  --vis-tooltip-text-color: rgba(0, 0, 0, 0.9) !important;
  --vis-tooltip-label-color: rgba(0, 0, 0, 0.7) !important;
  --vis-tooltip-value-color: rgba(0, 0, 0, 1) !important;

  --vis-axis-grid-color: rgba(255, 255, 255, 0.1) !important;
  --vis-axis-tick-label-color:  var(--ui-text-muted) !important;
  --vis-axis-label-color: var(--ui-text-toned) !important;
  --vis-legend-label-color: var(--ui-text-muted) !important;
  --vis-tooltip-title-color: var(--ui-text) !important;
  --vis-tooltip-title-border-bottom: 1px solid var(--ui-border) !important;
  --vis-tooltip-title-padding: 0.2rem !important;
  --vis-tooltip-box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
  --vis-tooltip-border-radius: 8px !important;
  --vis-tooltip-border-color: var(--ui-border) !important;
  --vis-tooltip-background-color: var(--ui-bg) !important;
  --vis-tooltip-text-color: var(--ui-text) !important;
  --vis-tooltip-divider: var(--ui-border) !important;
  --vis-tooltip-value-font-size: 0.875rem !important;
  --vis-tooltip-value-font-weight: 600 !important;
  --vis-tooltip-value-color: var(--ui-text) !important;
  --vis-tooltip-label-color: var(--ui-text-muted) !important;

  --dot-pattern-color: #111827;
}

.dark {
  --dot-pattern-color: #9ca3af;
}

.dot-pattern {
  position: absolute;

  background-image: radial-gradient(var(--dot-pattern-color) 1px, transparent 1px);
  background-size: 7px 7px;
  background-position: -8.5px -8.5px;
  opacity: 20%;

  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 1), transparent 75%);
}
</style>
