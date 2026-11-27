<script setup lang="ts">
/**
 * Where the median sits between the lowest and highest of the five runs.
 */
const props = defineProps<{
  low: string
  median: string
  high: string
  /** Position of the median along the strip, 0–100. */
  position: number | string
}>()

const motion = useAgentsMotion()
const left = computed(() => `${Number(props.position)}%`)
</script>

<template>
  <figure
    :aria-label="`Nuxt's tokens across five runs: ${low} lowest, ${median} median, ${high} highest`"
    class="not-prose relative m-0 flex flex-col pt-2"
  >
    <p class="relative mb-11 font-mono text-xs/none font-medium tracking-[0.06em] uppercase text-muted">
      Nuxt's tokens, five runs
    </p>
    <div aria-hidden="true" class="relative h-3.5 mx-1.75">
      <div class="absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-accented" />
      <span class="absolute left-0 top-0 size-3.5 -ml-1.75 rounded-full bg-default ring-2 ring-inset ring-(--ui-border-accented)" />
      <span class="absolute left-full top-0 size-3.5 -ml-1.75 rounded-full bg-default ring-2 ring-inset ring-(--ui-border-accented)" />
      <svg width="32" height="32" viewBox="0 0 32 32" class="absolute -top-2.25 -ml-4 overflow-visible" :style="{ left }">
        <circle
          v-if="motion"
          cx="16"
          cy="16"
          r="7"
          fill="none"
          class="stroke-(--ui-primary)"
          stroke-width="1.5"
        >
          <animate attributeName="r" values="7;15" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="7" class="fill-(--ui-primary)" />
      </svg>
      <span class="absolute bottom-6.5 -translate-x-[30%] font-mono text-sm/none font-medium text-highlighted whitespace-nowrap" :style="{ left }">
        {{ median }} median
      </span>
    </div>
    <div class="relative flex justify-between gap-3 mt-3.5 font-mono text-[13px]/snug text-muted">
      <span>{{ low }} lowest</span>
      <span class="text-right">{{ high }} highest</span>
    </div>
  </figure>
</template>
