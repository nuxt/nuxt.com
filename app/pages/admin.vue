<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')

definePageMeta({
  layout: 'admin'
})

interface FeedbackItem {
  id: number
  rating: 'very-helpful' | 'helpful' | 'neutral' | 'not-helpful' | 'confusing'
  feedback?: string
  path: string
  createdAt: Date | string
}

const { data: rawFeedback } = await useFetch<FeedbackItem[]>('/api/feedback')

const feedbackData = computed(() =>
  rawFeedback.value?.map(item => ({
    ...item,
    createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
  })) || []
)

const ratingConfig = {
  'very-helpful': { emoji: '🤩', color: 'success', label: 'Very Helpful' },
  'helpful': { emoji: '😊', color: 'primary', label: 'Helpful' },
  'neutral': { emoji: '🙂', color: 'warning', label: 'Neutral' },
  'not-helpful': { emoji: '☹️', color: 'orange', label: 'Not Helpful' },
  'confusing': { emoji: '😰', color: 'error', label: 'Confusing' }
} as const

const stats = computed(() => {
  const total = feedbackData.value.length
  const ratingCounts = feedbackData.value.reduce((acc, item) => {
    acc[item.rating] = (acc[item.rating] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const helpful = (ratingCounts['very-helpful'] || 0) + (ratingCounts['helpful'] || 0)
  const helpfulPercentage = total > 0 ? Math.round((helpful / total) * 100) : 0
  const negative = (ratingCounts['not-helpful'] || 0) + (ratingCounts['confusing'] || 0)

  return {
    total,
    helpful,
    helpfulPercentage,
    negative,
    veryHelpful: ratingCounts['very-helpful'] || 0,
    neutral: ratingCounts['neutral'] || 0
  }
})

const pathFilter = ref('')
const feedbackFilter = ref('')
const ratingFilter = ref('all')

const filteredData = computed(() => {
  let filtered = feedbackData.value

  if (pathFilter.value) {
    filtered = filtered.filter(item =>
      item.path.toLowerCase().includes(pathFilter.value.toLowerCase())
    )
  }

  if (feedbackFilter.value) {
    filtered = filtered.filter(item =>
      item.feedback?.toLowerCase().includes(feedbackFilter.value.toLowerCase())
    )
  }

  if (ratingFilter.value !== 'all') {
    filtered = filtered.filter(item => item.rating === ratingFilter.value)
  }

  return filtered
})

const sorting = ref([{ id: 'createdAt', desc: true }])

const columns: TableColumn<FeedbackItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => `#${row.getValue('id')}`
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Date',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-chevron-up'
            : 'i-lucide-chevron-down'
          : 'i-lucide-chevrons-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'rating',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Rating',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-chevron-up'
            : 'i-lucide-chevron-down'
          : 'i-lucide-chevrons-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const rating = row.getValue('rating') as keyof typeof ratingConfig
      const config = ratingConfig[rating]

      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('span', config.emoji),
        h('span', { class: 'capitalize text-sm' }, config.label)
      ])
    }
  },
  {
    accessorKey: 'path',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Page',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-chevron-up'
            : 'i-lucide-chevron-down'
          : 'i-lucide-chevrons-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => h('code', {
      class: 'text-xs bg-muted px-1.5 py-0.5 rounded'
    }, row.getValue('path'))
  },
  {
    accessorKey: 'feedback',
    header: 'Feedback',
    cell: ({ row }) => {
      const feedback = row.getValue('feedback') as string
      if (!feedback) {
        return h('span', { class: 'text-muted text-sm italic' }, 'No comment')
      }
      return h('div', {
        class: 'max-w-xs truncate text-sm',
        title: feedback
      }, feedback)
    }
  }
]

const ratingOptions = [
  { value: 'all', label: 'All Ratings' },
  { value: 'very-helpful', label: '🤩 Very Helpful' },
  { value: 'helpful', label: '😊 Helpful' },
  { value: 'neutral', label: '🙂 Neutral' },
  { value: 'not-helpful', label: '☹️ Not Helpful' },
  { value: 'confusing', label: '😰 Confusing' }
]
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col gap-2 mb-8">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-bar-chart" class="size-8 text-primary" />
        <span class="text-2xl font-bold">Feedback Dashboard</span>
      </div>
      <span class="text-muted">
        Monitor user feedback and documentation satisfaction across docs and blog pages
      </span>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-xs text-muted uppercase tracking-wide">Total</span>
            <span class="text-2xl font-bold text-primary">{{ stats.total }}</span>
          </div>
          <UIcon name="i-lucide-message-circle-more" class="size-5 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-xs text-muted uppercase tracking-wide">Helpful</span>
            <span class="text-2xl font-bold text-primary">{{ stats.helpfulPercentage }}%</span>
          </div>
          <UIcon name="i-lucide-smile" class="size-5 text-primary" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-xs text-muted uppercase tracking-wide">Very Helpful</span>
            <span class="text-2xl font-bold text-primary">{{ stats.veryHelpful }}</span>
          </div>
          <UIcon name="i-lucide-star" class="size-5 text-primary" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-xs text-muted uppercase tracking-wide">Neutral</span>
            <span class="text-2xl font-bold text-warning">{{ stats.neutral }}</span>
          </div>
          <UIcon name="i-lucide-minus" class="size-5 text-warning" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-xs text-muted uppercase tracking-wide">Negative</span>
            <span class="text-2xl font-bold text-error">{{ stats.negative }}</span>
          </div>
          <UIcon name="i-lucide-triangle-alert" class="size-5 text-error" />
        </div>
      </UCard>
    </div>

    <UCard>
      <div class="flex items-center gap-2 mb-4">
        <UInput
          v-model="pathFilter"
          placeholder="Filter by page..."
          icon="i-lucide-search"
          class="max-w-sm"
        />

        <UInput
          v-model="feedbackFilter"
          placeholder="Filter feedback..."
          icon="i-lucide-message-circle"
          class="max-w-sm"
        />

        <USelect
          v-model="ratingFilter"
          :items="ratingOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Filter by rating"
          class="max-w-48"
        />

        <div class="ml-auto text-sm text-muted">
          {{ filteredData.length }} of {{ feedbackData.length }} entries
        </div>
      </div>

      <UTable
        v-model:sorting="sorting"
        :data="filteredData"
        :columns="columns"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />
    </UCard>
  </UContainer>
</template>
