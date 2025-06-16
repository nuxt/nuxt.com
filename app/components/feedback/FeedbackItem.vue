<script setup lang="ts">
type FeedbackItem = FeedbackSubmission & {
  updatedAt: Date
  createdAt: Date
  country?: string
}

interface Props {
  feedback: FeedbackItem
}

defineProps<Props>()

const ratingConfig = computed(() => {
  return FEEDBACK_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option
    return acc
  }, {} as Record<FeedbackRating, typeof FEEDBACK_OPTIONS[0]>)
})

function getScoreColor(score: number) {
  if (score >= 4.0) return 'text-success'
  if (score >= 3.0) return 'text-warning'
  return 'text-error'
}
</script>

<template>
  <div class="border border-default rounded-lg p-4 hover:bg-muted/20 transition-colors">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="flex flex-col items-center">
          <span class="text-2xl">{{ ratingConfig[feedback.rating].emoji }}</span>
          <span class="text-xs font-bold" :class="getScoreColor(ratingConfig[feedback.rating].score)">
            {{ ratingConfig[feedback.rating].score }}/4
          </span>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium">{{ ratingConfig[feedback.rating].label }}</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="size-3" />
              {{ new Date(feedback.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) }}
            </span>
            <span v-if="feedback.country" class="flex items-center gap-1">
              <UIcon name="i-lucide-map-pin" class="size-3" />
              {{ feedback.country }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="feedback.feedback" class="text-sm leading-relaxed bg-muted/30 rounded p-3">
      "{{ feedback.feedback }}"
    </div>
    <div v-else class="text-sm text-muted italic">
      No additional comment provided
    </div>
  </div>
</template>
