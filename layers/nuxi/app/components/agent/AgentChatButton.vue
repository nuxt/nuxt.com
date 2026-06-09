<script setup lang="ts">
import { motion } from 'motion-v'

const { toggle, isOpen } = useNuxtAgent()
const { track } = useAnalytics()

function handleToggle() {
  track('Nuxi Toggled', { source: 'header', open: !isOpen.value })
  toggle()
}
</script>

<template>
  <motion.div
    v-show="!isOpen"
    :initial="{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }"
    :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
    :transition="{ duration: 0.25, ease: 'easeOut' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      label="Ask Nuxi"
      aria-label="Ask Nuxi"
      class="group max-sm:p-1.5"
      :ui="{ label: 'hidden sm:inline-flex' }"
      @click="handleToggle"
    >
      <template #leading>
        <span class="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden max-sm:size-5">
          <AgentNuxiIcon class="size-6 max-sm:size-5" />
        </span>
      </template>
    </UButton>
  </motion.div>
</template>
