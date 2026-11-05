<script setup lang="ts">
const props = defineProps<{
  readingTime: number
  target?: HTMLElement | null
}>()

const progress = ref(0)
const minutesLeft = computed(() => Math.ceil(props.readingTime * (1 - progress.value)))
const reducedMotion = usePreferredReducedMotion()

function update() {
  if (!props.target) return
  const rect = props.target.getBoundingClientRect()
  const range = rect.height - window.innerHeight
  progress.value = range <= 0
    ? (rect.bottom <= window.innerHeight ? 1 : 0)
    : Math.min(1, Math.max(0, -rect.top / range))
}

let frame = 0
function scheduleUpdate() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(update)
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}

useEventListener('scroll', scheduleUpdate, { passive: true })
useEventListener('resize', scheduleUpdate, { passive: true })
onMounted(update)
</script>

<template>
  <div class="flex flex-col border-t border-default pt-2">
    <UButton
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-arrow-up"
      class="-mx-2.5 gap-2 text-muted"
      @click="backToTop"
    >
      <template #leading>
        <svg viewBox="0 0 16 16" aria-hidden="true" class="size-4 shrink-0 -rotate-90">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke-width="2"
            class="stroke-(--ui-border-accented)"
          />
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            pathLength="100"
            stroke-dasharray="100"
            :stroke-dashoffset="100 - progress * 100"
            class="stroke-primary"
          />
        </svg>
      </template>

      <span class="flex-1 text-start tabular-nums">
        {{ minutesLeft ? `${minutesLeft} min left` : 'Finished' }}<span class="sr-only">, back to top</span>
      </span>
    </UButton>
  </div>
</template>
