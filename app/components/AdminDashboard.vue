<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')
const { user, clear } = useUserSession()

async function logout() {
  await clear()
  navigateTo('/admin/login')
}

const { data: rawFeedback, refresh: refreshFeedback } = await useFetch<FeedbackItem[]>('/api/feedback')
const { deleteFeedback } = useFeedbackDelete()

async function handleDeleteFeedback(feedbackId: number) {
  const success = await deleteFeedback(feedbackId)
  if (success) {
    await refreshFeedback()
  }
  showFeedbackModal.value = false
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
    let filtered = pageAnalytics.value

    if (versionFilter.value === 'v3') {
      filtered = filtered.filter(page => !page.path.includes('docs/4.x'))
    } else if (versionFilter.value === 'v4') {
      filtered = filtered.filter(page => page.path.includes('docs/4.x'))
    }

    if (globalFilter.value.trim()) {
      const searchTerm = globalFilter.value.toLowerCase().trim()
      filtered = filtered.filter((page) => {
        const title = (page.lastFeedback?.title || '').toLowerCase()
        const path = page.path.toLowerCase()
        return title.includes(searchTerm) || path.includes(searchTerm)
      })
    }

    return filtered
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

const { globalStats, pageAnalytics } = useFeedbackData(rawFeedback)
const { table, pagination, sorting, globalFilter, columns, resetFilters, filterByVersion, filteredPageAnalytics, versionFilter } = useAdminTable()
const { selectedPage, showFeedbackModal, currentPage, itemsPerPage, paginatedFeedback, totalPages, viewPageDetails } = useFeedbackModal()

const feedbackContainer = useTemplateRef<HTMLElement>('feedbackContainer')

watch(currentPage, () => {
  nextTick(() => {
    if (feedbackContainer.value) {
      feedbackContainer.value.scrollTop = 0
    }
  })
})
</script>

<template>
  <div class="min-h-screen">
    <div class="absolute top-2 left-2 right-2 flex items-center justify-between">
      <div class="flex items-center gap-1">
        <UAvatar
          :src="user?.avatar_url"
          :alt="user?.login"
          size="xs"
        />
        <span class="text-sm">{{ user?.login }}</span>
      </div>
      <div class="flex items-center gap-1">
        <UColorModeButton />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          @click="logout"
        />
      </div>
    </div>
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
        <FeedbackDatePicker />
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
              percentage: `${Math.round(globalStats.averageScore / 4 * 100)}% satisfaction`,
              trend: `${globalStats.averageScore >= 3.5 ? '🎯 Excellent' : globalStats.averageScore >= 3.0 ? '👍 Good' : '⚠️ Needs work'}`,
              details: 'Weighted average of all ratings'
            }"
          />
        </div>

        <div class="border-t border-default pt-6">
          <FeedbackChart :page-analytics="pageAnalytics" />
        </div>

        <div class="border-t border-default pt-6">
          <div class="flex sm:items-center justify-between flex-col sm:flex-row mb-4 gap-4">
            <h2 class="text-xl font-semibold">
              Feedback by Page
            </h2>
            <div class="flex items-center gap-2">
              <UInput
                v-model="globalFilter"
                class="flex-1 max-w-sm"
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

    <UModal v-model:open="showFeedbackModal" :ui="{ content: 'max-w-3xl max-sm:max-h-[85vh] overflow-y-auto' }">
      <template #content>
        <UCard v-if="selectedPage">
          <template #header>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              class="absolute top-2 right-2"
              @click="showFeedbackModal = false"
            />
            <div>
              <h3 class="font-semibold text-lg sm:text-xl mb-2">
                {{ selectedPage.lastFeedback.title }}
              </h3>
              <div class="flex items-center gap-1">
                <ULink :to="`https://nuxt.com${selectedPage.path}`" target="_blank">
                  <code class="text-xs sm:text-sm bg-muted px-2 py-1 rounded">{{ selectedPage.path }}</code>
                </ULink>
                <UButton
                  size="sm"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-external-link"
                  :to="`https://nuxt.com${selectedPage.path}`"
                  target="_blank"
                />
                <UButton
                  v-if="selectedPage.lastFeedback.stem"
                  size="sm"
                  variant="ghost"
                  color="neutral"
                  :to="`https://github.com/nuxt/nuxt/edit/main/${selectedPage.lastFeedback.stem.replace('docs/4.x', 'docs')}.md`"
                  target="_blank"
                  icon="i-simple-icons-github"
                />
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
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

            <FeedbackStatCard
              icon="i-lucide-message-circle"
              icon-color="text-muted"
              :value="selectedPage.total"
              label="Responses"
              :popover-stats="{
                trend: `${selectedPage.total === 1 ? 'Single feedback' : 'Multiple feedbacks'}`,
                details: 'Total number of user feedback submissions for this page'
              }"
            />

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
          </div>

          <div class="space-y-3 sm:space-y-4">
            <h4 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-message-square" class="size-4 sm:size-5" />
              Individual Feedback
            </h4>
            <div class="space-y-3 sm:space-y-4">
              <div ref="feedbackContainer" class="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                <FeedbackItem
                  v-for="(feedback, index) in paginatedFeedback"
                  :key="index"
                  :feedback="feedback"
                  show-delete
                  @delete="handleDeleteFeedback"
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
