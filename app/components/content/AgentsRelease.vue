<script setup lang="ts">
/**
 * The release a card belongs to, as a marker on a timeline above it. `current` marks the
 * latest release in the row.
 */
defineProps<{
  version: string
  current?: boolean
}>()

defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <div class="not-prose flex flex-col gap-3.5">
    <p class="flex items-center gap-2.5 font-mono text-xs/none font-medium text-highlighted">
      <span
        aria-hidden="true"
        class="shrink-0 size-2.25 rounded-full border border-primary"
        :class="current ? 'bg-primary shadow-[0_0_10px_var(--ui-primary)]' : 'bg-default'"
      />
      {{ version }}
      <span aria-hidden="true" class="flex-1 h-px bg-linear-to-r from-(--ui-border-accented) to-(--ui-border)" />
    </p>
    <div class="flex-1 flex flex-col *:flex-1 *:my-0">
      <slot />
    </div>
  </div>
</template>
