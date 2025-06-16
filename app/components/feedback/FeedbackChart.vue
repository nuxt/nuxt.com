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

const viewMode = ref<'all' | 'top'>('top')

const hasValidData = computed(() => {
  return props.pageAnalytics.some(p => p.total > 0)
})

const chartData = computed(() => {
  const data: any[] = []
  const endDate = dateRange.value.end
  const startDate = dateRange.value.start

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const dailyScores: Record<string, number[]> = {}

  if (hasValidData.value) {
    props.pageAnalytics.forEach((page) => {
      page.feedback.forEach((feedback) => {
        const feedbackDate = new Date(feedback.createdAt)

        if (feedbackDate >= startDate && feedbackDate <= endDate) {
          const dateStr = feedbackDate.toISOString().split('T')[0]
          if (!dailyScores[dateStr]) {
            dailyScores[dateStr] = []
          }

          const ratingScore = FEEDBACK_OPTIONS.find(opt => opt.value === feedback.rating)?.score || 0
          dailyScores[dateStr].push(ratingScore)
        }
      })
    })
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

    if (hasValidData.value) {
      if (viewMode.value === 'all') {
        // Calculate overall average for this day
        if (dailyScores[dateStr] && dailyScores[dateStr].length > 0) {
          const dayAverage = dailyScores[dateStr].reduce((sum, score) => sum + score, 0) / dailyScores[dateStr].length
          lastKnownValues.average = Math.min(4.0, Number(dayAverage.toFixed(2)))
        }
        entry.average = lastKnownValues.average || 0
      } else {
        // Calculate for top pages
        const topPages = props.pageAnalytics
          .filter(p => p.total > 0)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)

        topPages.forEach((page) => {
          const key = page.path.split('/').pop()?.replace(/[^a-z0-9]/gi, '') || 'page'

          // Calculate this page's average for this day
          const pageFeedbackForDay = page.feedback.filter((feedback) => {
            const feedbackDate = new Date(feedback.createdAt).toISOString().split('T')[0]
            return feedbackDate === dateStr
          })

          if (pageFeedbackForDay.length > 0) {
            const dayAverage = pageFeedbackForDay.reduce((sum, feedback) => {
              const ratingScore = FEEDBACK_OPTIONS.find(opt => opt.value === feedback.rating)?.score || 0
              return sum + ratingScore
            }, 0) / pageFeedbackForDay.length
            lastKnownValues[key] = Math.min(4.0, Number(dayAverage.toFixed(2)))
          }

          entry[key] = lastKnownValues[key] || 0
        })
      }
    } else {
      if (viewMode.value === 'all') {
        entry.average = 0
      } else {
        entry.placeholder = 0
      }
    }

    data.push(entry)
  }

  return data
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

  if (viewMode.value === 'all') {
    return {
      average: {
        name: 'Average Rating',
        color: '#3b82f6'
      }
    }
  } else {
    const topPages = props.pageAnalytics
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return topPages.reduce((acc, page, index) => {
      const key = page.path.split('/').pop()?.replace(/[^a-z0-9]/gi, '') || 'page'
      const title = page.lastFeedback?.title || page.path
      acc[key] = {
        name: title.length > 25 ? title.substring(0, 25) + '...' : title,
        color: colors[index % colors.length]
      }
      return acc
    }, {} as Record<string, { name: string, color: string }>)
  }
})

const xFormatter = (index: number) => chartData.value[index]?.day || ''
const yFormatter = (value: number) => value === 0 ? '0' : `${Number(value).toFixed(1)}/4`

const dateRangeLabel = computed(() => {
  const daysDiff = Math.ceil((dateRange.value.end.getTime() - dateRange.value.start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 7) return `Last ${daysDiff} days`
  if (daysDiff <= 31) return `Last ${daysDiff} days`
  if (daysDiff <= 93) return `Last ${Math.round(daysDiff / 30)} months`
  if (daysDiff <= 186) return `Last ${Math.round(daysDiff / 30)} months`
  return `Last ${Math.round(daysDiff / 365)} year${daysDiff > 730 ? 's' : ''}`
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div>
          <UIcon name="i-lucide-trending-up" class="size-5 text-primary" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">
            Rating Evolution
          </h3>
          <p class="text-sm text-muted">
            Track satisfaction trends over time
          </p>
        </div>
      </div>

      <div v-if="hasValidData" class="flex items-center gap-2">
        <UButton
          :color="viewMode === 'top' ? 'primary' : 'neutral'"
          :variant="viewMode === 'top' ? 'solid' : 'ghost'"
          size="sm"
          label="Top Pages"
          @click="viewMode = 'top'"
        />
        <UButton
          :color="viewMode === 'all' ? 'primary' : 'neutral'"
          :variant="viewMode === 'all' ? 'solid' : 'ghost'"
          size="sm"
          label="Overall"
          @click="viewMode = 'all'"
        />
      </div>
    </div>

    <div class="relative rounded-xl overflow-hidden mb-8">
      <div class="dot-pattern h-[300px] -top-5 left-0 right-0" />
      <LineChart
        :data="chartData"
        :categories="chartCategories"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :x-label="dateRangeLabel"
        y-label="Rating (out of 4)"
        :show-tooltip="true"
        class="min-h-[300px]"
      />
    </div>

    <div v-if="!hasValidData" class="text-center py-4">
      <p class="text-sm text-muted">
        Chart shows no data - will display real trends once feedback is collected
      </p>
    </div>
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
  --vis-axis-tick-label-color: rgba(255, 255, 255, 0.6) !important;
  --vis-axis-label-color: rgba(255, 255, 255, 0.8) !important;
  --vis-legend-label-color: rgba(255, 255, 255, 0.8) !important;

  --dot-pattern-color: #111827;
}

.dark {
  --vis-tooltip-background-color: rgba(15, 23, 42, 0.95) !important;
  --vis-tooltip-border-color: rgba(255, 255, 255, 0.1) !important;
  --vis-tooltip-text-color: rgba(255, 255, 255, 0.9) !important;
  --vis-tooltip-label-color: rgba(255, 255, 255, 0.7) !important;
  --vis-tooltip-value-color: rgba(255, 255, 255, 1) !important;

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
