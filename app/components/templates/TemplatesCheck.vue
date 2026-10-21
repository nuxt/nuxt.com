<script setup lang="ts">
import type { TemplateHealth } from '#shared/types'

const props = defineProps<{
  health?: TemplateHealth
  /** Adds when the check ran. */
  detailed?: boolean
}>()

const check = computed(() => props.health?.check)
const version = computed(() => check.value?.nuxt?.replace(/-\d+\.[\da-f]+$/, ' nightly'))
const outdated = computed(() => isOutdated(props.health))
const failures = { install: 'Install failing', build: 'Build failing', start: 'Fails to start' }
</script>

<template>
  <span v-if="check" class="inline-flex items-center gap-1.5 min-w-0">
    <template v-if="check.status === 'failed'">
      <UIcon name="i-lucide-circle-x" class="size-[1.15em] shrink-0 text-error" />
      <span class="truncate text-error">{{ failures[check.step || 'build'] }}</span>
    </template>
    <template v-else>
      <UIcon :name="outdated ? 'i-lucide-triangle-alert' : 'i-lucide-circle-check'" class="size-[1.15em] shrink-0" :class="outdated ? 'text-warning' : 'text-success'" />
      <span class="truncate" :class="outdated ? 'text-warning' : 'text-default'">Builds with Nuxt {{ version }}</span>
    </template>
    <span v-if="detailed" class="shrink-0 text-muted">· checked <NuxtTime :datetime="check.checkedAt" relative /></span>
  </span>
  <span v-else-if="outdated && health?.nuxtMajor" class="inline-flex items-center gap-1.5 text-warning">
    <UIcon name="i-lucide-triangle-alert" class="size-[1.15em] shrink-0" />
    Nuxt {{ health.nuxtMajor }}
  </span>
</template>
