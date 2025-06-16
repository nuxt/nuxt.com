<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')

definePageMeta({
  layout: 'admin'
})

type FeedbackItem = FeedbackSubmission & {
  updatedAt: Date
  createdAt: Date
  country?: string
}

type PageAnalytic = {
  path: string
  total: number
  positive: number
  negative: number
  averageScore: number
  positivePercentage: number
  feedback: FeedbackItem[]
  lastFeedback: FeedbackItem
  createdAt: Date
  updatedAt: Date
}

const { data: rawFeedback } = await useFetch<FeedbackItem[]>('/api/feedback')

function useFeedbackData() {
  const feedbackData = computed(() =>
    rawFeedback.value?.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt)
    })) || []
  )

  const ratingConfig = computed(() => {
    return FEEDBACK_OPTIONS.reduce((acc, option) => {
      acc[option.value] = option
      return acc
    }, {} as Record<FeedbackRating, typeof FEEDBACK_OPTIONS[0]>)
  })

  const globalStats = computed(() => {
    const total = feedbackData.value.length
    const positive = feedbackData.value.filter(f => ['very-helpful', 'helpful'].includes(f.rating)).length
    const negative = feedbackData.value.filter(f => ['not-helpful', 'confusing'].includes(f.rating)).length

    const totalScore = feedbackData.value.reduce((sum, item) => sum + ratingConfig.value[item.rating].score, 0)
    const averageScore = total > 0 ? (totalScore / total).toFixed(1) : '0.0'

    const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0

    return {
      total,
      positive,
      negative,
      averageScore,
      positivePercentage
    }
  })

  const pageAnalytics = computed((): PageAnalytic[] => {
    const pageGroups: Record<string, FeedbackItem[]> = feedbackData.value.reduce((acc, item) => {
      if (!acc[item.path]) {
        acc[item.path] = []
      }
      acc[item.path].push(item)
      return acc
    }, {} as Record<string, FeedbackItem[]>)

    return Object.entries(pageGroups).map(([path, feedback]) => {
      const total = feedback.length
      const positive = feedback.filter(f => ['very-helpful', 'helpful'].includes(f.rating)).length
      const negative = feedback.filter(f => ['not-helpful', 'confusing'].includes(f.rating)).length

      const totalScore = feedback.reduce((sum, item) => sum + ratingConfig.value[item.rating].score, 0)
      const averageScore = total > 0 ? (totalScore / total).toFixed(1) : '0.0'

      const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0

      const sortedFeedback = feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const oldestFeedback = feedback.reduce((oldest, current) =>
        new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
      )

      return {
        path,
        total,
        positive,
        negative,
        averageScore: Number.parseFloat(averageScore),
        positivePercentage,
        feedback,
        lastFeedback: sortedFeedback[0],
        createdAt: new Date(oldestFeedback.createdAt),
        updatedAt: new Date(sortedFeedback[0].createdAt)
      }
    }).sort((a, b) => b.total - a.total)
  })

  function getScoreColor(score: number) {
    if (score >= 4.0) return 'text-success'
    if (score >= 3.0) return 'text-warning'
    return 'text-error'
  }

  return {
    feedbackData,
    ratingConfig,
    globalStats,
    pageAnalytics,
    getScoreColor
  }
}

function useAdminTable() {
  const table = useTemplateRef<any>('table')
  const pagination = ref({
    pageIndex: 0,
    pageSize: 5
  })

  const sorting = ref([
    {
      id: 'updatedAt',
      desc: true
    }
  ])

  const globalFilter = ref('')

  function resetFilters() {
    globalFilter.value = ''
    versionFilter.value = 'all'
    sorting.value = [{ id: 'updatedAt', desc: true }]
    pagination.value = { pageIndex: 0, pageSize: 5 }
  }

  const versionFilter = ref<'all' | 'v3' | 'v4'>('all')

  function filterByVersion(version: 'v3' | 'v4') {
    versionFilter.value = version
    pagination.value.pageIndex = 0
    if (version === 'v3') {
      globalFilter.value = ''
    } else {
      globalFilter.value = 'docs/4.x'
    }
  }

  const filteredPageAnalytics = computed(() => {
    if (versionFilter.value === 'all') {
      return pageAnalytics.value
    } else if (versionFilter.value === 'v3') {
      return pageAnalytics.value.filter(page => !page.path.includes('docs/4.x'))
    } else {
      return pageAnalytics.value.filter(page => page.path.includes('docs/4.x'))
    }
  })

  const columns: TableColumn<PageAnalytic>[] = [
    {
      accessorKey: 'path',
      header: 'Page',
      cell: ({ row }) => {
        const page = row.original
        return h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium text-sm' }, page.lastFeedback.title),
          h('code', { class: 'text-xs text-muted font-mono mt-1' }, page.path)
        ])
      }
    },
    {
      accessorKey: 'positive',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Positive',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5 text-success',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        return h('div', { class: 'text-center' }, [
          h('span', { class: 'font-medium text-success' }, row.original.positive.toString())
        ])
      }
    },
    {
      accessorKey: 'negative',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Negative',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5 text-error',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        return h('div', { class: 'text-center' }, [
          h('span', { class: 'font-medium text-error' }, row.original.negative.toString())
        ])
      }
    },
    {
      accessorKey: 'averageScore',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Score',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        const score = row.original.averageScore
        const colorClass = score >= 4.0 ? 'text-success' : score >= 3.0 ? 'text-warning' : 'text-error'
        return h('div', { class: 'text-center' }, [
          h('span', { class: `font-semibold ${colorClass}` }, `${score}/4`)
        ])
      }
    },
    {
      accessorKey: 'total',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Total',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        return h('div', { class: 'text-center font-medium' }, row.original.total.toString())
      }
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Created',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        const date = row.original.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit'
        })
        return h('div', { class: 'text-center' }, [
          h('span', { class: 'text-sm text-muted' }, date)
        ])
      }
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Last Update',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        const date = row.original.updatedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        return h('div', { class: 'text-center' }, [
          h('span', { class: 'text-sm text-muted' }, date)
        ])
      }
    }
  ]

  return {
    table,
    pagination,
    sorting,
    globalFilter,
    columns,
    resetFilters,
    filterByVersion,
    filteredPageAnalytics,
    versionFilter
  }
}

function useFeedbackModal() {
  const selectedPage = ref<PageAnalytic | null>(null)
  const showFeedbackModal = ref(false)
  const currentPage = ref(1)
  const itemsPerPage = 5

  const paginatedFeedback = computed(() => {
    if (!selectedPage.value) return []

    const sortedFeedback = [...selectedPage.value.feedback].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const startIndex = (currentPage.value - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return sortedFeedback.slice(startIndex, endIndex)
  })

  const totalPages = computed(() => {
    if (!selectedPage.value) return 0
    return Math.ceil(selectedPage.value.feedback.length / itemsPerPage)
  })

  function viewPageDetails(page: PageAnalytic) {
    selectedPage.value = page
    currentPage.value = 1
    showFeedbackModal.value = true
  }

  return {
    selectedPage,
    showFeedbackModal,
    currentPage,
    itemsPerPage,
    paginatedFeedback,
    totalPages,
    viewPageDetails
  }
}

const { globalStats, pageAnalytics, getScoreColor } = useFeedbackData()
const { table, pagination, sorting, globalFilter, columns, resetFilters, filterByVersion, filteredPageAnalytics, versionFilter } = useAdminTable()
const { selectedPage, showFeedbackModal, currentPage, itemsPerPage, paginatedFeedback, totalPages, viewPageDetails } = useFeedbackModal()
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-12">
      <div class="text-center mb-8 space-y-2">
        <UIcon name="i-lucide-bar-chart" class="size-8 text-primary mx-auto" />
        <h1 class="text-3xl font-bold">
          Feedback Analytics
        </h1>
        <p class="text-muted text-lg max-w-2xl mx-auto">
          Monitor user feedback and documentation satisfaction across all pages
        </p>
      </div>

      <UCard class="max-w-5xl mx-auto">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FeedbackStatCard
            icon="i-lucide-message-circle"
            :value="globalStats.total"
            label="Total"
            :popover-stats="{
              trend: `${Math.round(globalStats.total / 7)} per day average`,
              details: 'Total feedback responses across all pages'
            }"
          />

          <FeedbackStatCard
            icon="i-lucide-thumbs-up"
            icon-color="text-success"
            :value="globalStats.positive"
            label="Positive"
            :popover-stats="{
              percentage: `${globalStats.positivePercentage}% of total`,
              trend: `${globalStats.positivePercentage >= 70 ? '📈 Excellent' : globalStats.positivePercentage >= 50 ? '✅ Good' : '📉 Needs work'}`,
              details: 'Very helpful + Helpful responses'
            }"
          />

          <FeedbackStatCard
            icon="i-lucide-thumbs-down"
            icon-color="text-error"
            :value="globalStats.negative"
            label="Negative"
            :popover-stats="{
              percentage: `${100 - globalStats.positivePercentage}% of total`,
              trend: `${globalStats.negative <= 2 ? '🟢 Low volume' : globalStats.negative <= 5 ? '🟡 Moderate' : '🔴 High volume'}`,
              details: 'Not helpful + Confusing responses'
            }"
          />

          <FeedbackStatCard
            icon="i-lucide-target"
            icon-color="text-primary"
            :value="`${globalStats.averageScore}/4`"
            label="Avg Score"
            :popover-stats="{
              percentage: `${Math.round(Number.parseFloat(globalStats.averageScore) / 4 * 100)}% satisfaction`,
              trend: `${Number.parseFloat(globalStats.averageScore) >= 3.5 ? '🎯 Excellent' : Number.parseFloat(globalStats.averageScore) >= 3.0 ? '👍 Good' : '⚠️ Needs work'}`,
              details: 'Weighted average of all ratings'
            }"
          />
        </div>

        <div class="border-t border-default pt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">
              Feedback by Page
            </h2>
            <div class="flex items-center gap-2">
              <UInput
                v-model="globalFilter"
                class="max-w-sm"
                placeholder="Search pages..."
                icon="i-lucide-search"
              />
              <UTooltip text="Reset filters" :content="{ side: 'top' }">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-filter-x"
                  aria-label="Reset filters"
                  @click="resetFilters"
                />
              </UTooltip>
              <UTooltip text="Show only v3 pages" :content="{ side: 'top' }">
                <UButton
                  :color="versionFilter === 'v3' ? 'primary' : 'neutral'"
                  :variant="versionFilter === 'v3' ? 'solid' : 'outline'"
                  label="v3"
                  @click="filterByVersion('v3')"
                />
              </UTooltip>
              <UTooltip text="Show only v4 pages" :content="{ side: 'top' }">
                <UButton
                  :color="versionFilter === 'v4' ? 'primary' : 'neutral'"
                  :variant="versionFilter === 'v4' ? 'solid' : 'outline'"
                  label="v4"
                  @click="filterByVersion('v4')"
                />
              </UTooltip>
            </div>
          </div>

          <UTable
            ref="table"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            v-model:global-filter="globalFilter"
            :data="filteredPageAnalytics"
            :columns="columns"
            :pagination-options="{
              getPaginationRowModel: getPaginationRowModel()
            }"
            class="flex-1 cursor-pointer [&_tbody_tr]:cursor-pointer"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default'
            }"
            @select="(row) => viewPageDetails(row.original)"
          />

          <div class="flex justify-end border-t border-default pt-4">
            <UPagination
              :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
              :items-per-page="table?.tableApi?.getState().pagination.pageSize"
              :total="table?.tableApi?.getFilteredRowModel().rows.length"
              @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
            />
          </div>
        </div>
      </UCard>
    </UContainer>

    <UModal v-model:open="showFeedbackModal" :ui="{ content: 'max-w-3xl' }">
      <template #content>
        <UCard v-if="selectedPage">
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="font-semibold text-xl mb-2">
                  {{ selectedPage.lastFeedback.title }}
                </h3>
                <div class="flex items-center gap-3 flex-wrap">
                  <code class="text-sm bg-muted px-2 py-1 rounded">{{ selectedPage.path }}</code>
                  <UButton
                    v-if="selectedPage.lastFeedback.stem"
                    size="sm"
                    variant="solid"
                    color="primary"
                    :to="`https://github.com/nuxt/nuxt/edit/main/${selectedPage.lastFeedback.stem.replace('docs/4.x', 'docs')}.md`"
                    target="_blank"
                    icon="i-lucide-edit"
                    class="shadow-sm"
                    label="Edit page"
                  />
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-3xl font-bold mb-1" :class="getScoreColor(selectedPage.averageScore)">
                  {{ selectedPage.averageScore }}/4
                </div>
                <div class="text-sm text-muted">
                  {{ selectedPage.total }} {{ selectedPage.total === 1 ? 'response' : 'responses' }}
                </div>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <FeedbackStatCard
              icon="i-lucide-thumbs-up"
              icon-color="text-success"
              :value="selectedPage.positive"
              label="Positive"
              :popover-stats="{
                percentage: `${selectedPage.positivePercentage}% of responses`,
                trend: `${selectedPage.positivePercentage >= 70 ? '📈 Excellent' : selectedPage.positivePercentage >= 50 ? '✅ Good' : '📉 Poor'}`,
                details: 'Users found this page helpful'
              }"
            />

            <FeedbackStatCard
              icon="i-lucide-thumbs-down"
              icon-color="text-error"
              :value="selectedPage.negative"
              label="Negative"
              :popover-stats="{
                percentage: `${100 - selectedPage.positivePercentage}% of responses`,
                trend: `${selectedPage.negative <= 1 ? '🟢 Low' : selectedPage.negative <= 3 ? '🟡 Moderate' : '🔴 High'}`,
                details: 'Users found issues with this page'
              }"
            />

            <FeedbackStatCard
              icon="i-lucide-target"
              icon-color="text-primary"
              :value="`${selectedPage.averageScore}/4`"
              label="Average Score"
              :popover-stats="{
                percentage: `${Math.round(selectedPage.averageScore / 4 * 100)}% satisfaction`,
                trend: `${selectedPage.averageScore >= 3.5 ? '🎯 Excellent' : selectedPage.averageScore >= 3.0 ? '👍 Good' : '⚠️ Poor'}`,
                details: `Based on ${selectedPage.total} ${selectedPage.total === 1 ? 'response' : 'responses'}`
              }"
            />
          </div>

          <div class="space-y-4">
            <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-message-square" class="size-5" />
              Individual Feedback
            </h4>
            <div class="space-y-4">
              <div class="space-y-3">
                <FeedbackItem
                  v-for="(feedback, index) in paginatedFeedback"
                  :key="index"
                  :feedback="feedback"
                />
              </div>

              <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-default">
                <div class="text-sm text-muted">
                  Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, selectedPage.total) }} of {{ selectedPage.total }} feedbacks
                </div>
                <UPagination
                  v-model:page="currentPage"
                  :total="selectedPage.total"
                  :items-per-page="itemsPerPage"
                  :sibling-count="1"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
