<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const check = computed(() => props.health?.check)
const checkDetails = computed(() => {
  if (!check.value) return undefined
  if (check.value.status === 'failed') return `The daily check failed at the ${check.value.step} step, in a clean Vercel Sandbox with the template's own lockfile.`
  return check.value.live
    ? 'Installed from its lockfile, built and started in a clean Vercel Sandbox, then opened in a real browser. Checked daily.'
    : 'Installed from its lockfile and built in a clean Vercel Sandbox. It needs environment variables to start. Checked daily.'
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
    <UTooltip v-if="checkDetails" :text="checkDetails" :content="{ side: 'bottom', align: 'start' }" :ui="{ content: 'max-w-xs h-auto py-1.5', text: 'whitespace-normal text-pretty' }">
      <span class="inline-flex items-center gap-2 cursor-default">
        <TemplatesCheck :health="health" detailed />
        <UBadge
          v-if="check?.status === 'passed' && check.latest"
          label="Latest"
          color="success"
          variant="subtle"
          size="sm"
          class="rounded-full"
        />
      </span>
    </UTooltip>
    <TemplatesCheck v-else :health="health" />
    <span v-if="health?.updatedAt" class="inline-flex items-center gap-1.5">
      <UIcon name="i-lucide-git-commit-horizontal" class="size-4" />
      Updated <NuxtTime :datetime="health.updatedAt" relative />
    </span>
    <span v-if="health?.license" class="inline-flex items-center gap-1.5">
      <UIcon name="i-lucide-scale" class="size-4" />
      {{ health.license }}
    </span>
    <span v-if="health?.stars" class="inline-flex items-center gap-1.5">
      <UIcon name="i-lucide-star" class="size-4" />
      {{ formatNumber(health.stars) }}
    </span>
  </div>
</template>
