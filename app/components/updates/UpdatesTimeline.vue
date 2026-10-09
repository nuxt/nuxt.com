<script setup lang="ts">
import type { UpdatesTimelineItem } from '~/composables/useUpdates'

defineProps<{
  items: UpdatesTimelineItem[]
}>()

const track = useTemplateRef('track')
const reducedMotion = usePreferredReducedMotion()
const atStart = ref(true)
const atEnd = ref(false)

function updateEdges() {
  if (!track.value) return
  const { scrollLeft, scrollWidth, clientWidth } = track.value
  atStart.value = scrollLeft <= 1
  atEnd.value = scrollLeft + clientWidth >= scrollWidth - 1
}

onMounted(updateEdges)
useEventListener('resize', updateEdges)

function scroll(direction: 1 | -1) {
  track.value?.scrollBy({
    left: direction * track.value.clientWidth,
    behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth'
  })
}
</script>

<template>
  <section aria-labelledby="changelog-heading" class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-4">
      <h2 id="changelog-heading" class="text-2xl text-highlighted">
        Changelog
      </h2>
      <UFieldGroup size="sm">
        <UButton
          icon="i-lucide-chevron-left"
          aria-label="Newer releases"
          color="neutral"
          variant="outline"
          :disabled="atStart"
          @click="scroll(-1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          aria-label="Older releases"
          color="neutral"
          variant="outline"
          :disabled="atEnd"
          @click="scroll(1)"
        />
      </UFieldGroup>
    </div>

    <ol
      ref="track"
      class="-ms-3 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      @scroll.passive="updateEdges"
    >
      <li
        v-for="(item, index) in items"
        :key="item.key"
        class="w-[85%] shrink-0 snap-start sm:w-1/2 lg:w-1/4"
      >
        <div class="relative flex h-2.5 items-center ps-3" aria-hidden="true">
          <span class="absolute inset-x-0 border-t border-default" />
          <span class="relative size-2.5 rounded-full ring-4 ring-(--ui-bg)" :class="index === 0 ? 'bg-primary' : 'bg-accented'" />
        </div>

        <NuxtLink
          :to="item.to"
          :target="item.external ? '_blank' : undefined"
          class="group me-3 mt-3 flex flex-col gap-2 rounded-lg p-3 transition-colors hover:bg-elevated/60 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <h3 class="flex items-center gap-1.5 text-base text-highlighted">
            {{ item.title }}
            <UIcon
              :name="item.external ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'"
              class="size-4 shrink-0 text-dimmed transition group-hover:translate-x-0.5 group-hover:text-highlighted motion-reduce:transition-none"
            />
          </h3>
          <p class="line-clamp-2 text-sm text-muted">
            {{ item.description }}
          </p>
          <time :datetime="item.date" class="text-sm text-dimmed">{{ formatShortDate(item.date) }}</time>
        </NuxtLink>
      </li>
    </ol>

    <UButton
      to="/changelog"
      label="View Full Changelog"
      trailing-icon="i-lucide-arrow-right"
      color="neutral"
      variant="link"
      class="self-start px-0"
    />
  </section>
</template>
