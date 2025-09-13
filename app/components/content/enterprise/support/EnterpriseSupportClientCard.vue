<script setup lang="ts">
defineProps<{
  quote: string
  author: string
  job: string
  logo: {
    light: string
    dark: string
    alt?: string
    width?: number
    height?: number
  }
  achievements: Array<{
    label: string
    color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'important' | 'neutral'
  }>
}>()
</script>

<template>
  <UPageCard variant="subtle">
    <template #description>
      {{ quote }}
    </template>

    <div class="flex flex-col justify-end h-full gap-y-4">
      <div class="flex justify-between gap-x-8 pt-6">
        <div>
          <div class="font-semibold text-highlighted">
            {{ author }}
          </div>
          <div class="text-sm text-muted">
            {{ job }}
          </div>
        </div>

        <UColorModeImage
          :light="logo.light"
          :dark="logo.dark"
          :width="logo.width"
          :height="logo.height"
          :alt="logo.alt"
          class="h-6 shrink-0 max-w-[140px] grayscale"
        />
      </div>

      <ul class="flex gap-x-1 flex-wrap gap-2">
        <li v-for="achievement in achievements" :key="achievement.label">
          <UBadge v-bind="achievement" variant="subtle" />
        </li>
      </ul>
    </div>
  </UPageCard>
</template>
