<script setup lang="ts">
/**
 * One size drawn to scale on a full-width bar: `bar` is its share of the largest, 0–100.
 * The bar grows from zero once it scrolls into view when motion is allowed.
 */
const props = defineProps<{
  value: string
  label: string
  bar: number | string
  /** A note beside the value, e.g. "24 times smaller". */
  detail?: string
  highlight?: boolean
}>()

const motion = useAgentsMotion()
const root = useTemplateRef('root')
const visible = useElementVisibility(root, { once: true })

const width = computed(() => Math.min(100, Math.max(0, Number(props.bar) || 0)))
const shown = computed(() => !motion.value || visible.value ? width.value : 0)
</script>

<template>
  <div ref="root" class="not-prose flex flex-col gap-3.5">
    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <p class="text-[15px] font-medium text-muted">
        {{ label }}
      </p>
      <p class="flex items-baseline gap-4 font-heading font-medium text-[clamp(40px,5.4vw,80px)]/none tracking-[-0.04em] tabular-nums" :class="highlight ? 'text-primary' : 'text-highlighted'">
        <span v-if="detail" class="font-sans text-[15px] tracking-normal text-highlighted">{{ detail }}</span>
        {{ value }}
      </p>
    </div>
    <div aria-hidden="true" class="relative h-3.5 rounded-full" :class="highlight ? 'bg-elevated' : 'agents-size-track'">
      <span
        v-if="highlight"
        class="absolute inset-y-0 start-0 min-w-2.5 rounded-full bg-primary transition-[width] duration-1400 ease-snappy motion-reduce:transition-none"
        :style="{ width: `${shown}%` }"
      />
    </div>
  </div>
</template>

<style>
.agents-size-track {
  background: repeating-linear-gradient(90deg, var(--ui-border-accented) 0 2px, var(--ui-border) 2px 6px);
}
</style>
