<script setup lang="ts">
import { AnimatePresence, MotionConfig, motion } from 'motion-v'
import { FEEDBACK_OPTIONS, feedbackFormSchema } from '../../types'

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
</script>

<template>
  <MotionConfig
    :transition="{ type: 'spring', visualDuration: 0.25, bounce: 0 }"
  >
    <motion.div
      layout
      class="rounded-lg max-w-md"
    >
      <AnimatePresence mode="wait">
        <!-- Success State -->
        <motion.div
          v-if="isSubmitted"
          key="success"
          :initial="{ opacity: 0, scale: 0.95 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.3 }"
          class="flex items-center gap-3 py-2"
          role="status"
          aria-live="polite"
          aria-label="Feedback submitted successfully"
        >
          <motion.div
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="{ delay: 0.1, type: 'spring', visualDuration: 0.4 }"
            class="text-xl"
            aria-hidden="true"
          >
            ✨
          </motion.div>
          <motion.div
            :initial="{ opacity: 0, x: 10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ delay: 0.2, duration: 0.3 }"
          >
            <div class="text-sm font-medium text-highlighted">
              Thank you for your feedback!
            </div>
            <div class="text-xs text-muted mt-1">
              Your input helps us improve the documentation.
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          v-else
          key="feedback"
        >
          <fieldset>
            <motion.div layout class="flex items-center gap-3">
              <motion.legend id="feedback-legend" layout class="text-sm font-medium text-highlighted whitespace-nowrap">
                Was this helpful?
              </motion.legend>

              <motion.div
                layout
                class="flex gap-2"
                role="radiogroup"
                aria-labelledby="feedback-legend"
              >
                <UButton
                  v-for="option in FEEDBACK_OPTIONS"
                  :key="option.value"
                  class="flex items-center grayscale-80 hover:grayscale-0 justify-center size-8 rounded-lg border transition-all duration-150 focus:outline-2 focus:outline-primary focus:outline-offset-2"
                  :class="[
                    formState.rating === option.value
                      ? 'border-primary bg-primary/20 hover:bg-primary/30 grayscale-0'
                      : 'border-default bg-accented/20 hover:border-accented/70 hover:bg-accented/80'
                  ]"
                  :aria-label="`Rate as ${option.label}`"
                  role="radio"
                  :aria-checked="formState.rating === option.value"
                  @click="handleRatingSelect(option.value)"
                >
                  <span class="text-lg">{{ option.emoji }}</span>
                </UButton>
              </motion.div>
            </motion.div>
          </fieldset>

          <AnimatePresence>
            <motion.div
              v-if="isExpanded"
              key="expanded-form"
              :initial="{ opacity: 0, height: 0, marginTop: 0 }"
              :animate="{ opacity: 1, height: 'auto', marginTop: 8 }"
              :exit="{ opacity: 0, height: 0, marginTop: 0 }"
              :transition="{ duration: 0.3, ease: 'easeInOut' }"
              class="overflow-hidden"
              role="region"
              aria-label="Additional feedback form"
            >
              <motion.div
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                :transition="{ delay: 0.15, duration: 0.2 }"
                class="space-y-1"
              >
                <UForm :state="formState" :schema="feedbackFormSchema" @submit="submitFeedback">
                  <UFormField name="feedback">
                    <label for="feedback-textarea" class="sr-only">
                      Additional feedback (optional)
                    </label>
                    <UTextarea
                      id="feedback-textarea"
                      ref="textareaRef"
                      v-model="formState.feedback"
                      class="w-full rounded-xl text-sm leading-relaxed resize-vertical"
                      placeholder="Share your thoughts... (optional)"
                      :rows="4"
                      autoresize
                      aria-describedby="feedback-help"
                    />
                    <div id="feedback-help" class="sr-only">
                      Provide additional details about your experience with this page
                    </div>
                  </UFormField>
                  <div class="flex items-center mt-2">
                    <div class="flex gap-2">
                      <UButton
                        size="sm"
                        :disabled="isSubmitting"
                        type="submit"
                        class="focus:outline-0"
                        :aria-label="isSubmitting ? 'Sending feedback...' : 'Send feedback'"
                      >
                        <motion.span
                          class="flex items-center"
                          :transition="{ duration: 0.2, ease: 'easeInOut' }"
                        >
                          <motion.div
                            :animate="{
                              width: isSubmitting ? '14px' : '0px',
                              marginRight: isSubmitting ? '6px' : '0px',
                              opacity: isSubmitting ? 1 : 0,
                              scale: isSubmitting ? 1 : 0,
                              rotate: isSubmitting ? 360 : 0
                            }"
                            :transition="{
                              width: { duration: 0.2, ease: 'easeInOut' },
                              marginRight: { duration: 0.2, ease: 'easeInOut' },
                              opacity: { duration: 0.2 },
                              scale: { duration: 0.2, type: 'spring', bounce: 0.3 },
                              rotate: { duration: 1, ease: 'linear', repeat: Infinity }
                            }"
                            class="flex items-center justify-center overflow-hidden"
                          >
                            <Icon name="mdi:loading" class="size-3.5 shrink-0" />
                          </motion.div>
                          <motion.span
                            :animate="{
                              opacity: 1
                            }"
                            :transition="{ duration: 0.2, ease: 'easeInOut' }"
                          >
                            {{ isSubmitting ? 'Sending...' : 'Send' }}
                          </motion.span>
                        </motion.span>
                      </UButton>
                    </div>
                  </div>
                </UForm>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div
        aria-live="polite"
        class="sr-only"
      >
        <span v-if="isSubmitting">Sending your feedback...</span>
        <span v-else-if="isExpanded && formState.rating">
          Feedback form expanded. You can now add additional comments.
        </span>
      </div>
    </motion.div>
  </MotionConfig>
</template>
