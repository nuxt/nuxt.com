<script setup lang="ts">
import { motion } from 'motion-v'

const { toggle, isOpen } = useNuxtAgent()
const { track } = useAnalytics()

function handleToggle() {
  track('Nuxt Agent Toggled', { source: 'header', open: !isOpen.value })
  toggle()
}
</script>

<template>
  <motion.div
    :animate="isOpen
      ? { opacity: 0, scale: 0.8, filter: 'blur(4px)', width: '0px' }
      : { opacity: 1, scale: 1, filter: 'blur(0px)', width: 'auto' }"
    :transition="{ duration: 0.25, ease: 'easeOut' }"
    class="overflow-hidden"
  >
    <UButton
      color="neutral"
      variant="ghost"
      label="Ask Nuxi"
      class="group"
      @click="handleToggle"
    >
      <template #leading>
        <AgentNuxiIcon class="size-6 shrink-0" />
      </template>
    </UButton>
  </motion.div>
</template>
