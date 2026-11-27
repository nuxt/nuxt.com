<script setup lang="ts">
import type { AgentsHalf } from '~/utils/agents'

/**
 * Opens a half of the `/agents` page: its number, a large title, the description and a track
 * that lights this half. The title and description come from the markdown.
 */
const props = defineProps<{
  half: AgentsHalf['id']
}>()

defineSlots<{ title?: () => unknown, description?: () => unknown }>()

const halves = useAgentsHalves()
const half = computed(() => halves.value.find(h => h.id === props.half))
</script>

<template>
  <section
    :id="half?.id ?? props.half"
    class="not-prose scroll-mt-[calc(var(--ui-header-height)+52px)]"
    :class="{ 'mt-6 lg:mt-12 border-t border-default': half && half.num > 1 }"
  >
    <UContainer class="flex flex-col gap-[clamp(20px,2.4vw,32px)] pt-[clamp(56px,7vw,112px)] pb-[clamp(40px,5vw,72px)]">
      <p v-if="half" class="flex flex-wrap items-center gap-3 font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted">
        <span class="inline-flex items-center justify-center size-10 rounded-[10px] border border-primary/35 bg-primary/10 text-primary">
          <UIcon :name="half.icon" class="size-5" />
        </span>
        <span>{{ agentsSectionNumber(half.num - 1) }} / {{ agentsSectionNumber(halves.length - 1) }}</span>
        <span aria-hidden="true" class="text-dimmed">—</span>
        <span>{{ half.when }}</span>
      </p>
      <h2 class="-ms-[0.05em] font-heading font-medium text-[clamp(52px,15vw,232px)]/[0.85] tracking-[-0.055em] text-highlighted [&_p]:my-0">
        <slot name="title" />
      </h2>
      <div class="max-w-136 text-[clamp(18px,1.6vw,24px)]/normal text-muted [&_p]:my-0">
        <slot name="description" />
      </div>
      <div v-if="half" aria-hidden="true" class="grid gap-1.5 mt-[clamp(8px,2vw,24px)]" :style="{ gridTemplateColumns: `repeat(${halves.length}, minmax(0, 1fr))` }">
        <span
          v-for="h in halves"
          :key="h.id"
          class="h-0.75 rounded-full"
          :class="h.num < half.num ? 'bg-primary/35' : h.num === half.num ? 'bg-primary' : 'bg-accented'"
        />
      </div>
    </UContainer>
  </section>
</template>
