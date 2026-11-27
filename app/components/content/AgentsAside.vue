<script setup lang="ts">
/**
 * An unnumbered aside inside a section, e.g. the evals under the Conventions numbers: a label,
 * title and description on the left, the default slot (a visual and its link) on the right.
 */
defineProps<{
  id?: string
  /** The mono label above the title, e.g. "Evals". */
  label?: string
}>()

defineSlots<{ title?: () => unknown, description?: () => unknown, default?: () => unknown }>()
</script>

<template>
  <div
    :id="id"
    class="not-prose scroll-mt-[calc(var(--ui-header-height)+84px)] mt-[clamp(24px,4vw,64px)] flex flex-wrap items-center justify-between gap-x-16 gap-y-8 p-[clamp(24px,4vw,64px)] rounded-[20px] border border-default bg-elevated/40"
  >
    <div class="flex-[1_1_420px] min-w-0 flex flex-col gap-3">
      <p v-if="label" class="flex items-center gap-2.5 font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted">
        <span class="size-2 rounded-full bg-primary" />
        {{ label }}
      </p>
      <h3 class="font-heading font-medium text-[clamp(26px,2.6vw,36px)]/[1.1] tracking-[-0.03em] text-highlighted [&_p]:my-0">
        <slot name="title" />
      </h3>
      <div class="max-w-136 text-base/[1.6] text-muted [&_p]:my-0">
        <slot name="description" />
      </div>
    </div>
    <div class="flex-[0_1_440px] min-w-0 flex flex-col gap-3 *:my-0">
      <slot />
    </div>
  </div>
</template>
