<script setup lang="ts">
import type { ModuleHealth } from '#shared/types'

defineProps<{
  health: ModuleHealth
  npm: string
}>()
</script>

<template>
  <UTooltip :text="`Score: ${health.score}/100`">
    <NuxtLink
      :to="`https://nuxt.care/?search=npm:${npm}`"
      target="_blank"
      class="inline-flex hover:opacity-80 transition-opacity"
      @click.stop
    >
      <span class="inline-flex items-center font-medium text-xs px-2 py-1 rounded-l-md ring ring-inset ring-accented text-default bg-elevated">
        nuxt.care
      </span>
      <span
        class="inline-flex items-center font-medium capitalize text-xs px-2 py-1 rounded-r-md"
        :style="{
          backgroundColor: `color-mix(in srgb, ${health.color} 10%, transparent)`,
          color: health.color,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${health.color} 25%, transparent)`
        }"
      >
        {{ health.status }}
      </span>
    </NuxtLink>
  </UTooltip>
</template>
