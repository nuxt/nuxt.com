<script setup lang="ts">
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

const ratingConfig = {
  'very-helpful': { emoji: '🤩', label: 'Very Helpful', score: 4 },
  'helpful': { emoji: '😊', label: 'Helpful', score: 3 },
  'not-helpful': { emoji: '☹️', label: 'Not Helpful', score: 2 },
  'confusing': { emoji: '😰', label: 'Confusing', score: 1 }
} as const

const selectedPage = ref<any>(null)
const showFeedbackModal = ref(false)

const globalStats = computed(() => {
  const total = feedbackData.value.length
  const positive = feedbackData.value.filter(f => ['very-helpful', 'helpful'].includes(f.rating)).length
  const negative = feedbackData.value.filter(f => ['not-helpful', 'confusing'].includes(f.rating)).length

  const totalScore = feedbackData.value.reduce((sum, item) => sum + ratingConfig[item.rating].score, 0)
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
  const pageGroups = feedbackData.value.reduce((acc, item) => {
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

    const totalScore = feedback.reduce((sum, item) => sum + ratingConfig[item.rating].score, 0)
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
  <UContainer class="py-8">
    <div class="flex flex-col gap-2 mb-8">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-bar-chart" class="size-8 text-primary" />
        <span class="text-2xl font-bold">Feedback Analytics</span>
      </div>
      <span class="text-muted">
        Monitor user feedback and documentation satisfaction across all pages
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-muted mb-1">
              Total Feedback
            </div>
            <div class="text-3xl font-bold">
              {{ globalStats.total }}
            </div>
            <div class="text-xs text-muted mt-1">
              All responses
            </div>
          </div>
          <UIcon name="i-lucide-message-circle" class="size-8 text-primary" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-muted mb-1">
              Positive
            </div>
            <div class="text-3xl font-bold">
              {{ globalStats.positive }}
            </div>
            <div class="text-xs text-success mt-1">
              {{ globalStats.positivePercentage }}% positive
            </div>
          </div>
          <UIcon name="i-lucide-thumbs-up" class="size-8 text-success" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-muted mb-1">
              Negative
            </div>
            <div class="text-3xl font-bold">
              {{ globalStats.negative }}
            </div>
            <div class="text-xs text-error mt-1">
              Needs attention
            </div>
          </div>
          <UIcon name="i-lucide-thumbs-down" class="size-8 text-error" />
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h3 class="font-semibold">
          Feedback grouped by page
        </h3>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-default">
              <th class="text-left py-3 px-4 font-medium text-sm text-muted">
                URL
              </th>
              <th class="text-right py-3 px-4 font-medium text-sm text-muted">
                Positive
              </th>
              <th class="text-right py-3 px-4 font-medium text-sm text-muted">
                Negative
              </th>
              <th class="text-right py-3 px-4 font-medium text-sm text-muted">
                Score
              </th>
              <th class="text-right py-3 px-4 font-medium text-sm text-muted">
                Feedbacks
              </th>
              <th class="text-right py-3 px-4 font-medium text-sm text-muted">
                Last Feedback
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="page in pageAnalytics"
              :key="page.path"
              class="border-b border-default hover:bg-muted/30 transition-colors cursor-pointer"
              @click="viewPageDetails(page)"
            >
              <td class="py-3 px-4">
                <code class="text-sm font-mono">{{ page.path }}</code>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="font-medium text-success">{{ page.positive }}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="font-medium text-error">{{ page.negative }}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <span class="font-semibold" :class="getScoreColor(page.averageScore)">
                  {{ page.averageScore }}/4
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="font-medium">
                  {{ page.total }}
                </div>
              </td>
              <td class="py-3 px-4 text-right text-sm text-muted">
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
    </UCard>

    <UModal v-model:open="showFeedbackModal">
      <template #content>
        <UCard v-if="selectedPage" class="sm:max-w-4xl">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold">
                  Page Feedback Details
                </h3>
                <code class="text-sm bg-muted px-2 py-1 rounded mt-1 inline-block">{{ selectedPage.path }}</code>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold" :class="getScoreColor(selectedPage.averageScore)">
                  {{ selectedPage.averageScore }}/5
                </div>
                <div class="text-sm text-muted">
                  {{ selectedPage.total }} responses
                </div>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
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
              v-for="feedback in selectedPage.feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())"
              :key="feedback.id"
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
  </UContainer>
</template>
