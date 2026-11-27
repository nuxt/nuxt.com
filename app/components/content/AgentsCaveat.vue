<script setup lang="ts">
/**
 * The note under a set of numbers: its title on the left, how they were measured and the
 * source on the right. Always visible.
 */
defineProps<{
  icon?: string
}>()

defineSlots<{ title?: () => unknown, default?: () => unknown }>()
</script>

<template>
  <div class="not-prose flex flex-wrap items-start gap-x-12 gap-y-3">
    <p class="flex-[0_1_260px] flex items-center gap-2.5 text-[15px] font-semibold text-highlighted [&_p]:my-0">
      <UIcon :name="icon ?? 'i-lucide-info'" class="shrink-0 size-4.5 text-muted" />
      <slot name="title" />
    </p>
    <div
      class="flex-[999_1_480px] min-w-0 max-w-208 flex flex-col gap-2 text-[15px]/[1.65] text-muted [&>p]:my-0
        [&_a:not([data-slot])]:text-primary [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-3"
    >
      <slot />
    </div>
  </div>
</template>
