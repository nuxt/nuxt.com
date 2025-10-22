<script setup lang="ts">
const { isStreaming = false } = defineProps<{
  text: string
  isStreaming?: boolean
}>()

const open = ref(false)

watch(() => isStreaming, () => {
  open.value = isStreaming
}, { immediate: true })

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/^#+\s+/gm, '') // Remove headers
}
</script>

<template>
  <UCollapsible v-model:open="open" class="flex flex-col gap-1" :ui="{ content: 'border-l-2 border-default pl-2' }">
    <UButton
      class="px-0 group"
      size="xs"
      color="neutral"
      variant="link"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        trailingIcon: text.length > 0 ? 'group-data-[state=open]:rotate-180 transition-transform duration-200' : 'hidden'
      }"
      :label="isStreaming ? 'Thinking...' : 'Thoughts'"
    />

    <template #content>
      <div v-for="(value, index) in cleanMarkdown(text).split('\n').filter(Boolean)" :key="index">
        <span class="text-xs text-muted">{{ value }}</span>
      </div>
    </template>
  </UCollapsible>
</template>
