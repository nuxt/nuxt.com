<script setup lang="ts">
const { toggle, isOpen } = useAssistant()
const { track } = useAnalytics()

function handleToggle() {
  track('Assistant Toggled', { source: 'header', open: !isOpen.value })
  toggle()
}
</script>

<template>
  <UTooltip text="Ask AI">
    <UButton
      icon="i-custom-ai"
      color="neutral"
      variant="ghost"
      @click="handleToggle"
    />
  </UTooltip>
</template>
