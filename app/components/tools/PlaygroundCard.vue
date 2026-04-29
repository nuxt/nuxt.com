<script setup lang="ts">
const props = defineProps<{
  url: string
  repo: string
  title?: string
  file?: string
  dir?: string
}>()

const safeUrl = computed(() => {
  try {
    const parsed = new URL(props.url)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#'
  } catch {
    return '#'
  }
})
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-default bg-elevated/50 p-3">
    <div class="flex items-center justify-center size-10 rounded-md bg-elevated shrink-0">
      <UIcon name="i-simple-icons-stackblitz" class="size-5 text-[#1389FD]" />
    </div>
    <div class="min-w-0 flex-1">
      <span class="text-sm font-semibold text-highlighted truncate block">{{ title || repo }}</span>
      <span class="text-[11px] text-muted truncate block">{{ file || 'app.vue' }}{{ dir ? ` · ${dir}` : '' }}</span>
    </div>
    <UButton
      icon="i-lucide-external-link"
      label="Open"
      size="xs"
      color="primary"
      variant="soft"
      :to="safeUrl"
      target="_blank"
    />
  </div>
</template>
