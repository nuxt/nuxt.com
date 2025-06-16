<script setup lang="ts">
import type { FeedbackSubmission, FeedbackRating } from '../../shared/types/feedback'
import { FEEDBACK_OPTIONS } from '../../shared/types/feedback'

definePageMeta({
  layout: 'admin'
})

type FeedbackItem = FeedbackSubmission & {
  updatedAt: Date
  createdAt: Date
}

const { data: rawFeedback } = await useFetch<FeedbackItem[]>('/api/feedback')

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

const selectedPage = ref<{
  path: string
  total: number
  positive: number
  negative: number
  averageScore: number
  positivePercentage: number
  feedback: FeedbackItem[]
  lastFeedback: FeedbackItem
} | null>(null)
const showFeedbackModal = ref(false)

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

const pageAnalytics = computed(() => {
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

    return {
      path,
      total,
      positive,
      negative,
      averageScore: Number.parseFloat(averageScore),
      positivePercentage,
      feedback,
      lastFeedback: feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    }
  }).sort((a, b) => b.total - a.total)
})

function viewPageDetails(page: any) {
  selectedPage.value = page
  showFeedbackModal.value = true
}

function getScoreColor(score: number) {
  if (score >= 4.0) return 'text-success'
  if (score >= 3.0) return 'text-warning'
  return 'text-error'
}
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

      <UCard class="max-w-4xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FeedbackStatCard
            icon="i-lucide-message-circle"
            :value="globalStats.total"
            label="Total Feedback"
            description="All responses"
          />

          <FeedbackStatCard
            icon="i-lucide-thumbs-up"
            icon-color="text-success"
            :value="globalStats.positive"
            label="Positive"
            :description="`${globalStats.positivePercentage}% positive`"
            description-color="text-success"
          />

          <FeedbackStatCard
            icon="i-lucide-thumbs-down"
            icon-color="text-error"
            :value="globalStats.negative"
            label="Negative"
            description="Needs attention"
            description-color="text-error"
          />
        </div>

        <div class="border-t border-default pt-6">
          <h2 class="text-xl font-semibold mb-4 text-center">
            Feedback by Page
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-default">
                  <th class="text-left py-4 px-4 font-medium text-sm text-muted">
                    Page
                  </th>
                  <th class="text-center py-4 px-4 font-medium text-sm text-muted">
                    Positive
                  </th>
                  <th class="text-center py-4 px-4 font-medium text-sm text-muted">
                    Negative
                  </th>
                  <th class="text-center py-4 px-4 font-medium text-sm text-muted">
                    Score
                  </th>
                  <th class="text-center py-4 px-4 font-medium text-sm text-muted">
                    Total
                  </th>
                  <th class="text-center py-4 px-4 font-medium text-sm text-muted">
                    Last Feedback
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="page in pageAnalytics"
                  :key="page.path"
                  class="border-b border-default hover:bg-muted/20 transition-colors cursor-pointer"
                  @click="viewPageDetails(page)"
                >
                  <td class="py-4 px-4">
                    <div class="flex flex-col">
                      <span class="font-medium text-sm">{{ page.lastFeedback.title }}</span>
                      <code class="text-xs text-muted font-mono mt-1">{{ page.path }}</code>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span class="font-medium text-success">{{ page.positive }}</span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span class="font-medium text-error">{{ page.negative }}</span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span class="font-semibold" :class="getScoreColor(page.averageScore)">
                      {{ page.averageScore }}/4
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <div class="font-medium">
                      {{ page.total }}
                    </div>
                  </td>
                  <td class="py-4 px-4 text-center text-sm text-muted">
                    {{ new Date(page.lastFeedback.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UCard>
    </UContainer>

    <!-- Modal -->
    <UModal v-model:open="showFeedbackModal">
      <template #content>
        <UCard v-if="selectedPage" class="sm:max-w-4xl">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-lg">
                  {{ selectedPage.lastFeedback.title }}
                </h3>
                <code class="text-sm bg-muted px-2 py-1 rounded mt-2 inline-block">{{ selectedPage.path }}</code>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold" :class="getScoreColor(selectedPage.averageScore)">
                  {{ selectedPage.averageScore }}/4
                </div>
                <div class="text-sm text-muted">
                  {{ selectedPage.total }} responses
                </div>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/20 rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-success">
                {{ selectedPage.positive }}
              </div>
              <div class="text-xs text-muted">
                Positive
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-error">
                {{ selectedPage.negative }}
              </div>
              <div class="text-xs text-muted">
                Negative
              </div>
            </div>
          </div>

          <div class="space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="(feedback, index) in [...selectedPage.feedback].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())"
              :key="index"
              class="border border-default rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{{ ratingConfig[feedback.rating].emoji }}</span>
                  <div>
                    <span class="text-sm font-medium">{{ ratingConfig[feedback.rating].label }}</span>
                    <div class="text-xs text-muted">
                      Score: {{ ratingConfig[feedback.rating].score }}/4
                    </div>
                  </div>
                </div>
                <span class="text-xs text-muted">
                  {{ new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) }}
                </span>
              </div>
              <p v-if="feedback.feedback" class="text-sm">
                {{ feedback.feedback }}
              </p>
              <p v-else class="text-sm text-muted italic">
                No additional comment provided
              </p>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
