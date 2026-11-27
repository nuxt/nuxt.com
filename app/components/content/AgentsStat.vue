<script setup lang="ts">
/**
 * A number with its label, icon and rank, without a card: the rank line under the value
 * and, with `place` and `of`, rank marks with the `place`-th lit.
 *
 * With `alt-value`, the stat holds a second result for the same metric (e.g. client-rendered
 * next to server-rendered). With motion the two take turns every 4s and the lit mark slides
 * between their places. With reduced motion both are shown, one under the other.
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
  /** The second result: its value, rank line and place. */
  altValue?: string
  altDetail?: string
  altPlace?: number | string
  /** Value and lit mark in primary. */
  highlight?: boolean
  /** `md` for stats beside other content, `lg` for a row of stats on their own. */
  size?: 'md' | 'lg'
}>(), {
  size: 'md'
})

const motion = useAgentsMotion()
const reducedMotion = usePreferredReducedMotion()

const of = computed(() => Number(props.of) || 0)
const sets = computed(() => [
  { value: props.value, detail: props.detail, place: Number(props.place) || 0 },
  ...(props.altValue ? [{ value: props.altValue, detail: props.altDetail, place: Number(props.altPlace) || 0 }] : [])
])
/** Both results in one spot, taking turns. Off with reduced motion, where they stack instead. */
const layered = computed(() => sets.value.length > 1 && reducedMotion.value !== 'reduce')
const ranked = computed(() => of.value > 0 && sets.value.every(set => set.place > 0))

const summary = computed(() => sets.value.map(set => [`${set.value}${props.unit ? ` ${props.unit}` : ''}`, set.detail].filter(Boolean).join(', ')).join('. '))

const markX = (place: number) => `calc(${place - 1} * (var(--mark-w) + 3px))`
const marks = computed(() => ({
  '--mark-w': `calc((100% - ${of.value - 1} * 3px) / ${of.value})`,
  '--mark-a': markX(sets.value[0]!.place),
  '--mark-b': markX(sets.value.at(-1)!.place)
}))

const valueClass = computed(() => [
  'font-heading font-medium leading-none tabular-nums whitespace-nowrap',
  props.highlight ? 'text-primary' : 'text-highlighted',
  props.size === 'lg' ? 'text-[clamp(48px,6vw,88px)]/[0.95] tracking-[-0.045em]' : 'text-[clamp(30px,3vw,44px)] tracking-[-0.03em]'
])
const trackClass = computed(() => ['relative flex gap-0.75', { 'max-w-70': props.size === 'lg' }])
const markClass = computed(() => props.highlight ? 'bg-primary' : 'bg-inverted')
const swap = (index: number) => ({
  class: ['[grid-area:1/1]', motion.value ? 'agents-stat-swap' : index ? 'invisible' : ''],
  style: { animationDelay: index ? '-4s' : '0s' }
})
</script>

<template>
  <div class="not-prose flex flex-col gap-2.5" :class="{ 'gap-3.5': size === 'lg' }">
    <p class="flex items-center justify-between gap-3 text-sm/5 font-medium text-muted">
      {{ label }}
      <UIcon v-if="icon" :name="icon" class="shrink-0 size-4" :class="highlight ? 'text-primary' : 'text-muted'" />
    </p>

    <template v-if="layered">
      <p class="sr-only">
        {{ summary }}
      </p>

      <div aria-hidden="true" class="grid overflow-hidden">
        <p v-for="(set, index) in sets" :key="index" :class="[valueClass, swap(index).class]" :style="swap(index).style">
          {{ set.value }}<span v-if="unit" class="ms-1.5 text-[0.4em] tracking-[-0.01em] text-muted">{{ unit }}</span>
        </p>
      </div>

      <div v-if="ranked" aria-hidden="true" :class="trackClass" :style="marks">
        <span v-for="index in of" :key="index" class="flex-1 h-1 rounded-full bg-accented" />
        <span class="absolute inset-y-0 left-(--mark-a) w-(--mark-w) rounded-full" :class="[markClass, { 'agents-stat-mark': motion }]" />
      </div>

      <div aria-hidden="true" class="grid overflow-hidden">
        <p v-for="(set, index) in sets" :key="index" class="text-sm/5 font-medium text-toned" :class="swap(index).class" :style="swap(index).style">
          {{ set.detail }}
        </p>
      </div>
    </template>

    <template v-for="(set, index) in sets" v-else :key="index">
      <p :class="[valueClass, { 'mt-3': index }]">
        {{ set.value }}<span v-if="unit" class="ms-1.5 text-[0.4em] tracking-[-0.01em] text-muted">{{ unit }}</span>
      </p>
      <div v-if="ranked" aria-hidden="true" :class="trackClass">
        <span
          v-for="mark in of"
          :key="mark"
          class="flex-1 h-1 rounded-full"
          :class="mark === set.place ? markClass : 'bg-accented'"
        />
      </div>
      <p v-if="set.detail" class="text-sm/5 font-medium text-toned">
        {{ set.detail }}
      </p>
    </template>
  </div>
</template>

<style>
/* An 8s loop: the first result shows for about 3.4s, slides up and out as the second comes
   in from below, then the second does the same. The second runs 4s ahead (`-4s` delay). */
.agents-stat-swap {
  animation: agents-stat-swap 8s cubic-bezier(0.5, 0, 0.2, 1) infinite;
}

.agents-stat-mark {
  animation: agents-stat-mark 8s cubic-bezier(0.5, 0, 0.2, 1) infinite;
}

.agents-stats:hover :is(.agents-stat-swap, .agents-stat-mark) {
  animation-play-state: paused;
}

@keyframes agents-stat-swap {
  0%, 42.5% { opacity: 1; transform: none }
  50% { opacity: 0; transform: translateY(-40%) }
  50.01%, 92.5% { opacity: 0; transform: translateY(40%) }
  100% { opacity: 1; transform: none }
}

@keyframes agents-stat-mark {
  0%, 42.5% { left: var(--mark-a) }
  50%, 92.5% { left: var(--mark-b) }
  100% { left: var(--mark-a) }
}
</style>
