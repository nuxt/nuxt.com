<script setup lang="ts">
const props = defineProps<{
  description: string
  prompt: string
  icon?: string
  deeplinks: {
    cursor: string
    claude: string
  }
}>()

const { track } = useAnalytics()
const expanded = ref(false)

const previewLimit = 280
const isLong = computed(() => props.prompt.length > previewLimit)
const previewText = computed(() => {
  if (expanded.value || !isLong.value) return props.prompt
  return `${props.prompt.slice(0, previewLimit)}…`
})

function openInCursor() {
  track('Nuxi Prompt Opened', { ide: 'cursor', source: 'nuxt-agent' })
  window.open(props.deeplinks.cursor, '_self')
}

function openInClaudeCode() {
  track('Nuxi Prompt Opened', { ide: 'claude', source: 'nuxt-agent' })
  window.open(props.deeplinks.claude, '_self')
}
</script>

<template>
  <div class="flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <div class="flex items-start gap-2.5 px-3 py-2.5">
      <UIcon
        :name="icon ?? 'i-lucide-sparkles'"
        class="size-4 text-primary shrink-0 mt-0.5"
      />
      <span class="text-sm font-medium text-highlighted">{{ description }}</span>
    </div>

    <div class="px-3 pb-2.5 border-t border-default pt-2.5">
      <pre class="text-xs text-muted whitespace-pre-wrap font-mono leading-relaxed">{{ previewText }}</pre>
      <UButton
        v-if="isLong"
        size="xs"
        color="neutral"
        variant="link"
        :label="expanded ? 'Show less' : 'Show full prompt'"
        class="mt-1 px-0"
        @click="expanded = !expanded"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-default">
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        label="Open in Cursor"
        leading-icon="i-custom-cursor"
        @click="openInCursor"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        label="Open in Claude Code"
        leading-icon="i-lucide-terminal"
        @click="openInClaudeCode"
      />
    </div>
  </div>
</template>
