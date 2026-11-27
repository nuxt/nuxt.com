<script setup lang="ts">
/**
 * The headline number of a section, set large in primary between two rules, with its rank
 * marks. The default slot fills the other column (the range and the secondary stats).
 */
const props = defineProps<{
  value: string
  label: string
  /** The rank line under the value, e.g. "Fewest of 12". */
  detail?: string
  /** A lucide icon name, e.g. `i-lucide-type`. */
  icon?: string
  place?: number | string
  of?: number | string
}>()

const slots = defineSlots<{ default?: () => unknown }>()

const place = computed(() => Number(props.place) || 0)
const of = computed(() => Number(props.of) || 0)
</script>

<template>
  <div class="not-prose grid lg:grid-cols-2 border-y border-default">
    <div class="flex flex-col justify-between gap-7 py-[clamp(24px,3vw,40px)] lg:pe-12">
      <p class="flex items-center gap-2.5 font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted">
        <UIcon v-if="icon" :name="icon" class="size-4 text-primary" />
        {{ label }}
      </p>
      <div class="flex flex-col gap-4.5">
        <p class="-ms-[0.05em] font-heading font-medium text-[clamp(96px,16vw,248px)]/[0.8] tracking-[-0.06em] tabular-nums text-primary">
          {{ value }}
        </p>
        <p v-if="detail" class="text-[clamp(18px,1.6vw,22px)] font-medium text-highlighted">
          {{ detail }}
        </p>
        <div v-if="of > 0 && place > 0" aria-hidden="true" class="flex gap-1 max-w-90">
          <span
            v-for="index in of"
            :key="index"
            class="flex-1 h-1 rounded-full"
            :class="index === place ? 'bg-primary' : 'bg-accented'"
          />
        </div>
      </div>
    </div>
    <div
      v-if="slots.default"
      class="flex flex-col justify-center gap-7 py-[clamp(24px,3vw,40px)] max-lg:border-t lg:border-s lg:ps-12 border-default *:my-0"
    >
      <slot />
    </div>
  </div>
</template>
