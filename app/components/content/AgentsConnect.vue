<script setup lang="ts">
/**
 * The "Connect your agent" layout: the setup console with the tool list and tips beside it,
 * then the extra cards in a row below.
 */
defineSlots<{ default?: () => unknown, aside?: () => unknown, below?: () => unknown }>()
</script>

<template>
  <div class="not-prose flex flex-col gap-4">
    <div class="flex flex-wrap items-stretch gap-4">
      <div class="flex-[1.5_1_560px] min-w-0 flex flex-col gap-5 p-4 sm:p-7 rounded-2xl border border-default bg-elevated [--agents-code-bg:var(--ui-bg)] *:my-0">
        <slot />
      </div>
      <div class="flex-[1_1_360px] min-w-0 flex flex-col gap-6 *:my-0">
        <slot name="aside" />
      </div>
    </div>
    <div class="grid lg:grid-cols-2 gap-4 *:my-0">
      <slot name="below" />
    </div>
  </div>
</template>
