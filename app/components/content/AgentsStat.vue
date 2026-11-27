<script setup lang="ts">
/**
 * A number with its label, icon and rank, without a card: the rank line under the value
 * and, with `place` and `of`, rank marks with the `place`-th lit.
 */
const props = withDefaults(defineProps<{
  value: string
  /** A unit set smaller after the value, e.g. "ms". */
  unit?: string
  label: string
  /** The rank line under the value, e.g. "3rd of 12". */
  detail?: string
  /** A lucide icon name, e.g. `i-lucide-clock`. */
  icon?: string
  place?: number | string
  of?: number | string
  /** Value and lit mark in primary. */
  highlight?: boolean
  /** `md` for stats beside other content, `lg` for a row of stats on their own. */
  size?: 'md' | 'lg'
}>(), {
  size: 'md'
})

const place = computed(() => Number(props.place) || 0)
const of = computed(() => Number(props.of) || 0)
</script>

<template>
  <div class="not-prose flex flex-col gap-2.5" :class="{ 'gap-3.5': size === 'lg' }">
    <p class="flex items-center justify-between gap-3 text-sm/5 font-medium text-muted">
      {{ label }}
      <UIcon v-if="icon" :name="icon" class="shrink-0 size-4" :class="highlight ? 'text-primary' : 'text-muted'" />
    </p>
    <p
      class="font-heading font-medium leading-none tabular-nums whitespace-nowrap"
      :class="[
        highlight ? 'text-primary' : 'text-highlighted',
        size === 'lg' ? 'text-[clamp(48px,6vw,88px)]/[0.95] tracking-[-0.045em]' : 'text-[clamp(30px,3vw,44px)] tracking-[-0.03em]'
      ]"
    >
      {{ value }}<span v-if="unit" class="ms-1.5 text-[0.4em] tracking-[-0.01em] text-muted">{{ unit }}</span>
    </p>
    <div v-if="of > 0 && place > 0" aria-hidden="true" class="flex gap-0.75" :class="{ 'max-w-70': size === 'lg' }">
      <span
        v-for="index in of"
        :key="index"
        class="flex-1 h-1 rounded-full"
        :class="index === place ? (highlight ? 'bg-primary' : 'bg-inverted') : 'bg-accented'"
      />
    </div>
    <p v-if="detail" class="text-sm/5 font-medium text-toned">
      {{ detail }}
    </p>
  </div>
</template>
