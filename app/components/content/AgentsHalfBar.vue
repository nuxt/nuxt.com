<script setup lang="ts">
import type { AgentsHalf } from '~/utils/agents'

/**
 * Sticks below the site header: the current half and section and a link to the other half, over a
 * track split per half. Scroll-spy on the section ids.
 */
const props = defineProps<{
  halves: AgentsHalf[]
}>()

const sections = computed(() => props.halves.flatMap(half => half.sections.map(section => ({ ...section, half }))))
const currentId = ref<string>()

const bar = useTemplateRef('bar')

// A section is current once its top passes under this bar. Reaching a half's header
// already counts as its first section.
function update() {
  const threshold = (bar.value?.getBoundingClientRect().bottom ?? 116) + 24
  let current = sections.value[0]?.id
  for (const half of props.halves) {
    const marks = [{ el: half.id, id: half.sections[0]?.id }, ...half.sections.map(section => ({ el: section.id, id: section.id }))]
    for (const mark of marks) {
      const top = document.getElementById(mark.el)?.getBoundingClientRect().top
      if (top !== undefined && top <= threshold) current = mark.id
    }
  }
  currentId.value = current
}

onMounted(update)
useEventListener('scroll', update, { passive: true })
useEventListener('resize', update, { passive: true })

const current = computed(() => sections.value.find(s => s.id === currentId.value) ?? sections.value[0])
const half = computed(() => current.value?.half)
const other = computed(() => props.halves.find(h => h.id !== half.value?.id))
const inHalf = computed(() => half.value?.sections ?? [])
const index = computed(() => inHalf.value.findIndex(s => s.id === current.value?.id))
const progress = computed(() => inHalf.value.length ? `${Math.round(((index.value + 1) / inHalf.value.length) * 100)}%` : '0%')

// Halves before the current one are full, the current one shows how far into it you are.
function fill(h: AgentsHalf) {
  if (!half.value) return '0%'
  if (h.num < half.value.num) return '100%'
  return h.num === half.value.num ? progress.value : '0%'
}
</script>

<template>
  <nav
    v-if="half && current"
    ref="bar"
    aria-label="Page halves"
    class="sticky top-(--ui-header-height) z-40 bg-default/80 backdrop-blur-md"
  >
    <UContainer class="h-13 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2.5 min-w-0 text-sm">
        <a
          :href="`#${half.id}`"
          class="shrink-0 inline-flex items-center gap-2 h-7 px-2.5 rounded-full border border-default bg-elevated text-[13px] font-medium text-highlighted hover:border-accented focus-visible:outline-2 focus-visible:outline-primary transition-colors"
        >
          <span class="size-1.5 rounded-full bg-primary" />
          <span class="font-mono text-xs text-muted">{{ half.num }} / {{ halves.length }}</span>
          <span class="max-sm:hidden">{{ half.title }}</span>
        </a>
        <span aria-hidden="true" class="text-dimmed">/</span>
        <span class="min-w-0 truncate font-medium text-highlighted">{{ current.label }}</span>
      </div>

      <a
        v-if="other"
        :href="`#${other.id}`"
        class="shrink-0 inline-flex items-center gap-1.5 min-h-9 text-[13px] font-medium text-muted hover:text-highlighted whitespace-nowrap transition-colors"
      >
        <UIcon v-if="other.num < half.num" name="i-lucide-arrow-up" class="size-3.5" />
        {{ other.title }}
        <UIcon v-if="other.num > half.num" name="i-lucide-arrow-down" class="size-3.5" />
      </a>
    </UContainer>
    <div aria-hidden="true" class="grid h-px bg-(--ui-border)" :style="{ gridTemplateColumns: `repeat(${halves.length}, minmax(0, 1fr))` }">
      <span v-for="h in halves" :key="h.id" class="relative">
        <span class="absolute inset-y-0 start-0 bg-primary transition-[width] duration-300 motion-reduce:transition-none" :style="{ width: fill(h) }" />
      </span>
    </div>
  </nav>
</template>
