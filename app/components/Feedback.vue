<script setup lang="ts">
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'

const props = defineProps<{
  page: {
    title: string
    stem: string
  }
}>()

const {
  formState,
  isExpanded,
  isSubmitted,
  isSubmitting,
  handleRatingSelect,
  submitFeedback
} = useFeedbackForm(props)

const FEEDBACK_MOODS: Record<FeedbackRating, { mood: NuxiMood, text: string, hover: string, active: string }> = {
  'very-helpful': { mood: 'happy', text: 'text-primary', hover: 'hover:text-primary hover:border-primary/50', active: 'text-primary border-primary bg-primary/15' },
  'helpful': { mood: 'idle', text: 'text-primary', hover: 'hover:text-primary hover:border-primary/50', active: 'text-primary border-primary bg-primary/15' },
  'not-helpful': { mood: 'sad', text: 'text-info', hover: 'hover:text-info hover:border-info/50', active: 'text-info border-info bg-info/15' },
  'confusing': { mood: 'confused', text: 'text-warning', hover: 'hover:text-warning hover:border-warning/50', active: 'text-warning border-warning bg-warning/15' }
}

const previewRating = ref<FeedbackRating | null>(null)
const reactiveRating = computed(() => previewRating.value ?? formState.rating)

const reduceMotion = useReducedMotion()
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1] as const

const success = computed(() => ({
  nuxi: {
    initial: { opacity: 0, transform: reduceMotion.value ? 'scale(1)' : 'scale(0.8)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 0.35, ease: EASE_OUT_BACK }
  },
  text: (delay: number) => ({
    initial: { opacity: 0, filter: 'blur(2px)', transform: reduceMotion.value ? 'none' : 'translateY(4px)' },
    animate: { opacity: 1, filter: 'blur(0px)', transform: 'none' },
    transition: { duration: 0.3, ease: EASE_OUT, delay }
  })
}))
</script>

<template>
  <AnimatePresence mode="wait" :initial="false">
    <motion.div
      v-if="isSubmitted"
      key="success"
      class="flex items-center gap-3"
      role="status"
    >
      <motion.div v-bind="success.nuxi" class="shrink-0" aria-hidden="true">
        <AgentNuxiIcon mood="happy" :interactive="false" class="w-12 h-auto text-primary" />
      </motion.div>
      <div>
        <motion.p v-bind="success.text(0.08)" class="text-sm font-medium text-highlighted">
          Thank you for your feedback!
        </motion.p>
        <motion.p v-bind="success.text(0.14)" class="text-xs text-muted mt-1">
          Your input helps us improve the documentation.
        </motion.p>
      </div>
    </motion.div>

    <motion.div
      v-else
      key="feedback"
      :exit="{ opacity: 0, filter: 'blur(2px)' }"
      :transition="{ duration: 0.15, ease: EASE_OUT }"
    >
      <div class="flex items-center gap-3">
        <AgentNuxiIcon
          :mood="reactiveRating ? FEEDBACK_MOODS[reactiveRating].mood : 'idle'"
          :interactive="false"
          class="w-12 h-auto shrink-0 transition-colors duration-200 ease-out"
          :class="reactiveRating ? FEEDBACK_MOODS[reactiveRating].text : 'text-muted'"
          aria-hidden="true"
        />

        <div class="space-y-1.5 min-w-0">
          <p id="feedback-label" class="text-sm font-medium text-highlighted">
            Was this helpful?
          </p>

          <div
            role="group"
            aria-labelledby="feedback-label"
            class="flex flex-wrap gap-1"
            @mouseleave="previewRating = null"
          >
            <UButton
              v-for="option in FEEDBACK_OPTIONS"
              :key="option.value"
              size="xs"
              color="neutral"
              variant="ghost"
              :label="option.label"
              :aria-pressed="formState.rating === option.value"
              class="rounded-full border px-2.5 transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-primary"
              :class="formState.rating === option.value
                ? FEEDBACK_MOODS[option.value].active
                : ['border-default bg-accented/20 text-muted hover:bg-accented/60', FEEDBACK_MOODS[option.value].hover]"
              @mouseenter="previewRating = option.value"
              @focus="previewRating = option.value"
              @blur="previewRating = null"
              @click="handleRatingSelect(option.value)"
            />
          </div>
        </div>
      </div>

      <!-- Open: rows grow, then content fades in top to bottom. Close: content fades out, then rows collapse. -->
      <div
        class="grid transition-[grid-template-rows] motion-reduce:transition-none"
        :class="isExpanded
          ? 'grid-rows-[1fr] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]'
          : 'grid-rows-[0fr] duration-250 delay-100 ease-[cubic-bezier(0.77,0,0.175,1)]'"
        :inert="!isExpanded"
      >
        <!-- Padding keeps the textarea focus ring inside the clipped area. -->
        <div class="min-h-0 overflow-hidden -mx-1 px-1">
          <UForm
            :state="formState"
            :schema="feedbackFormSchema"
            class="max-w-md pt-3 pb-1 space-y-2"
            @submit="submitFeedback"
          >
            <div
              class="transition-[opacity,transform,filter]"
              :class="isExpanded
                ? 'opacity-100 translate-y-0 blur-[0px] duration-300 delay-75 ease-[cubic-bezier(0.23,1,0.32,1)]'
                : 'opacity-0 motion-safe:-translate-y-1 blur-[2px] duration-150 ease-out'"
            >
              <UFormField name="feedback" label="Additional feedback (optional)" :ui="{ label: 'sr-only' }">
                <UTextarea
                  v-model="formState.feedback"
                  class="w-full"
                  placeholder="Share your thoughts... (optional)"
                  :rows="3"
                  autoresize
                />
              </UFormField>
            </div>

            <div
              class="transition-[opacity,transform,filter]"
              :class="isExpanded
                ? 'opacity-100 translate-y-0 blur-[0px] duration-300 delay-[130ms] ease-[cubic-bezier(0.23,1,0.32,1)]'
                : 'opacity-0 motion-safe:-translate-y-1 blur-[2px] duration-150 ease-out'"
            >
              <UButton
                type="submit"
                size="sm"
                :loading="isSubmitting"
                :label="isSubmitting ? 'Sending…' : 'Send'"
              />
            </div>
          </UForm>
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
</template>
