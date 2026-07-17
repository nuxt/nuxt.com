<script setup lang="ts">
const props = defineProps<{
  prompt: string
  label?: string
}>()

const { open } = useNuxtAgent()
const { track } = useAnalytics()
const nuxiMood = ref<NuxiMood>('idle')

function send() {
  nuxiMood.value = 'excited'
  track('Nuxi Message Sent', {
    source: 'blog-inline',
    page: useRoute().path,
    queryLength: props.prompt.length
  })
  open(props.prompt)
}
</script>

<template>
  <button
    type="button"
    class="not-prose group my-4 flex w-full items-center gap-3 rounded-lg border border-default bg-elevated/50 px-4 py-3 text-left transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    @click="send"
    @mouseenter="nuxiMood = 'happy'"
    @mouseleave="nuxiMood = 'idle'"
  >
    <AgentNuxiIcon class="size-6 shrink-0 text-primary" :mood="nuxiMood" :interactive="false" />
    <span class="flex min-w-0 flex-1 items-center gap-2">
      <span class="truncate font-mono text-sm text-default">{{ prompt }}</span>
    </span>
    <span class="flex items-center gap-1.5 text-xs font-medium text-muted group-hover:text-default">
      {{ label ?? 'Try in Nuxi' }}
      <UIcon name="i-lucide-arrow-up-right" class="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </span>
  </button>
</template>
