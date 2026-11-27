<script setup lang="ts">
/**
 * The Build AI card for Nuxi, the assistant on nuxt.com: the whole card opens it.
 */
defineSlots<{ title?: () => unknown, description?: () => unknown }>()

const { open } = useNuxtAgent()
const { track } = useAnalytics()

function ask() {
  track('Nuxi Opened', { source: 'agents-page' })
  open()
}
</script>

<template>
  <AgentsCard action link="Ask Nuxi" icon="i-custom-nuxi" @select="ask">
    <template #header>
      <AgentsChatPreview variant="nuxi" />
    </template>
    <template #title>
      <slot name="title" />
    </template>
    <template #description>
      <slot name="description" />
    </template>
  </AgentsCard>
</template>
