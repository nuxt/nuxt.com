<script setup lang="ts">
/**
 * A deploy uses the visitor's cooldown, so it takes a deliberate gesture: drag the knob to the end of the track.
 * Keyboard and assistive tech confirm by activating the knob: their clicks carry no pointer detail.
 * The knob rests at the start or the end through CSS, not the measured width, so reopening the panel shows it in place.
 */
const props = defineProps<{
  label: string
  /** Shown while the deploy runs, with the knob held at the end. */
  busyLabel?: string
  busy?: boolean
  /** Deployed: the knob stays at the end until the parent asks for another deploy. */
  done?: boolean
  doneLabel?: string
}>()

const emit = defineEmits<{ confirm: [] }>()

const KNOB = 56
const INSET = 4

const trackEl = useTemplateRef('track')
const offset = ref(0)
const { width } = useElementSize(trackEl)
const max = computed(() => Math.max(0, width.value - KNOB - INSET * 2))
const dragging = ref(false)
/** Set between a completed slide and the parent's `busy`, so the knob never springs back in between. */
const confirmed = ref(false)
let startX = 0

const atEnd = computed(() => props.busy || props.done || confirmed.value)
const progress = computed(() => atEnd.value ? 1 : max.value ? offset.value / max.value : 0)
const left = computed(() => dragging.value ? `${INSET + offset.value}px` : atEnd.value ? `calc(100% - ${KNOB + INSET}px)` : `${INSET}px`)

function onDown(event: PointerEvent) {
  if (atEnd.value) return
  dragging.value = true
  offset.value = 0
  startX = event.clientX
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}

function onMove(event: PointerEvent) {
  if (dragging.value) offset.value = Math.min(max.value, Math.max(0, event.clientX - startX))
}

function onUp() {
  if (!dragging.value) return
  const complete = max.value && offset.value >= max.value * 0.85
  dragging.value = false
  offset.value = 0
  if (complete) confirm()
}

/** A cancelled pointer (a system gesture, a rotation) is not a release: it never deploys. */
function onCancel() {
  dragging.value = false
  offset.value = 0
}

function confirm() {
  if (atEnd.value) return
  confirmed.value = true
  emit('confirm')
}

watch(() => props.busy, (busy) => {
  if (busy) confirmed.value = false
})
// A deploy that failed before it started leaves the knob where the visitor can slide again.
watch(confirmed, (value) => {
  if (value) setTimeout(() => confirmed.value = false, 1500)
})
</script>

<template>
  <div
    ref="track"
    class="relative h-11 rounded-full bg-elevated/30 ring ring-default select-none touch-none"
  >
    <span
      class="absolute inset-0 flex items-center justify-center text-sm tabular-nums pointer-events-none"
      :class="[atEnd ? 'ps-4 pe-16' : 'ps-16 pe-4', !dragging && 'transition-opacity duration-300']"
      :style="{ opacity: atEnd ? 1 : Math.max(0, 1 - progress * 1.6) }"
    >
      <span :class="busy ? 'shimmer' : done ? 'text-highlighted' : 'shimmer'" class="truncate">{{ busy ? busyLabel : done ? doneLabel : label }}</span>
    </span>
    <button
      type="button"
      :aria-label="done ? doneLabel : label"
      :disabled="busy || done"
      class="absolute top-1 h-9 w-14 rounded-full bg-primary text-inverted flex items-center justify-center shadow-sm shadow-primary/25 cursor-grab active:cursor-grabbing disabled:cursor-default duration-300 ease-snappy enabled:hover:bg-primary/90 enabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="dragging ? 'transition-[background-color,scale]' : 'transition-[left,background-color,scale]'"
      :style="{ left }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
      @click="$event.detail === 0 && confirm()"
    >
      <UIcon :name="busy ? 'i-lucide-loader-circle' : done || progress > 0.85 ? 'i-lucide-check' : 'i-lucide-arrow-right'" class="size-5" :class="busy && 'animate-spin'" />
    </button>
  </div>
</template>

<style scoped>
.shimmer {
  color: transparent;
  background: linear-gradient(90deg, var(--ui-text-muted) 40%, var(--ui-text-highlighted) 50%, var(--ui-text-muted) 60%) 0 0 / 300% 100%;
  background-clip: text;
  animation: shimmer 2.4s linear infinite;
}

@keyframes shimmer {
  from { background-position: 100% 0; }
  to { background-position: 0 0; }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
    color: var(--ui-text-muted);
  }
}
</style>
