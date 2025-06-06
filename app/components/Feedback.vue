<script setup lang="ts">
import { AnimatePresence, MotionConfig, motion } from 'motion-v'

interface FeedbackOption {
  emoji: string
  label: string
  value: string
}

const feedbackOptions: FeedbackOption[] = [
  { emoji: '🤩', label: 'Very helpful', value: 'very-helpful' },
  { emoji: '😊', label: 'Helpful', value: 'helpful' },
  { emoji: '☹️', label: 'Not helpful', value: 'not-helpful' },
  { emoji: '😰', label: 'Confusing', value: 'confusing' }
]

const selectedRating = ref<string | null>(null)
const feedbackText = ref('')
const isExpanded = ref(false)
const isSubmitted = ref(false)
const isSubmitting = ref(false)

function cancelFeedback() {
  selectedRating.value = null
  feedbackText.value = ''
  isExpanded.value = false
}

function handleRatingSelect(rating: string) {
  if (isSubmitted.value) return
  if (isExpanded.value && rating === selectedRating.value) {
    cancelFeedback()
    return
  }
  selectedRating.value = rating
  isExpanded.value = true
}

async function submitFeedback() {
  if (!selectedRating.value) return

  isSubmitting.value = true

  await new Promise(resolve => setTimeout(resolve, 1000))

  // TODO: Track the feedback event

  isSubmitting.value = false
  isSubmitted.value = true
}
</script>

<template>
  <MotionConfig
    :transition="{ type: 'spring', visualDuration: 0.25, bounce: 0 }"
  >
    <motion.div
      layout
      class="bg-muted border border-default backdrop-blur-sm rounded-lg max-w-md mx-auto shadow-lg"
      :class="isSubmitted ? 'px-6 py-1' : 'px-4 py-2'"
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
        >
          <motion.div
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="{ delay: 0.1, type: 'spring', visualDuration: 0.4 }"
            class="text-xl"
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
          <motion.div layout class="flex items-center justify-between gap-3">
            <motion.span layout class="text-sm font-medium text-highlighted whitespace-nowrap">
              Was this helpful?
            </motion.span>

            <motion.div layout class="flex gap-2">
              <UButton
                v-for="option in feedbackOptions"
                :key="option.value"
                class="flex items-center justify-center size-8 rounded-lg border transition-all duration-150"
                :class="[
                  selectedRating === option.value
                    ? 'border-primary bg-primary/20 hover:bg-primary/30'
                    : 'border-default bg-accented/20 hover:border-accented/70 hover:bg-accented/80'
                ]"
                @click="handleRatingSelect(option.value)"
              >
                <span class="text-sm">{{ option.emoji }}</span>
              </UButton>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            <motion.div
              v-if="isExpanded"
              key="expanded-form"
              :initial="{ opacity: 0, height: 0, marginTop: 0 }"
              :animate="{ opacity: 1, height: 'auto', marginTop: 16 }"
              :exit="{ opacity: 0, height: 0, marginTop: 0 }"
              :transition="{ duration: 0.3, ease: 'easeInOut' }"
              class="overflow-hidden"
            >
              <motion.div
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                :transition="{ delay: 0.15, duration: 0.2 }"
                class="space-y-3"
              >
                <UFormField
                  label="Your feedback... (optional)"
                  :ui="{ label: 'text-xs font-medium text-muted' }"
                >
                  <UTextarea
                    v-model="feedbackText"
                    class="w-full rounded-xl text-sm leading-relaxed resize-vertical"
                    placeholder="Share your thoughts..."
                    :rows="4"
                  />

                  <template #help>
                    <span class="flex items-center gap-1.5 text-xs text-muted">
                      <Icon name="mdi:language-markdown" class="w-3 h-3" />
                      Markdown supported.
                    </span>
                  </template>
                </UFormField>

                <div class="flex justify-end items-center">
                  <div class="flex gap-2">
                    <UButton
                      variant="subtle"
                      color="neutral"
                      size="sm"
                      :disabled="isSubmitting"
                      label="Cancel"
                      @click="cancelFeedback"
                    />
                    <UButton
                      size="sm"
                      :disabled="isSubmitting"
                      @click="submitFeedback"
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          v-if="isSubmitting"
                          key="sending"
                          :initial="{ opacity: 0 }"
                          :animate="{ opacity: 1 }"
                          :exit="{ opacity: 0 }"
                        >
                          <Icon name="mdi:loading" class="size-3.5 animate-spin" />
                          Sending...
                        </motion.span>
                        <motion.span
                          v-else
                          key="send"
                          :initial="{ opacity: 0 }"
                          :animate="{ opacity: 1 }"
                          :exit="{ opacity: 0 }"
                        >
                          Send
                        </motion.span>
                      </AnimatePresence>
                    </UButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </MotionConfig>
</template>
