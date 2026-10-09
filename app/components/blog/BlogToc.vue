<script setup lang="ts">
import type { TocLink } from 'comark/plugins/toc'
import { plainHeading } from '#shared/utils/heading'

const props = defineProps<{
  links: TocLink[]
  readingTime: number
  target?: HTMLElement | null
}>()

/** Distance from the top of the viewport at which a heading becomes the current section. */
const ACTIVE_OFFSET = 160

const sections = computed(() => props.links.map(link => ({
  id: link.id,
  text: plainHeading(link.text),
  children: (link.children ?? []).map(child => ({ id: child.id, text: plainHeading(child.text) }))
})))
const ids = computed(() => sections.value.flatMap(section => [section.id, ...section.children.map(child => child.id)]))

const activeId = ref<string>()
const progress = ref(0)
const openId = computed(() => sections.value.find(section =>
  section.id === activeId.value || section.children.some(child => child.id === activeId.value)
)?.id)
const minutesLeft = computed(() => Math.ceil(props.readingTime * (1 - progress.value)))

const list = useTemplateRef<HTMLElement>('list')
const indicator = ref({ top: 0, height: 0 })
const reducedMotion = usePreferredReducedMotion()

function placeIndicator() {
  const anchor = activeId.value && list.value?.querySelector<HTMLElement>(`[data-heading="${CSS.escape(activeId.value)}"]`)
  if (anchor) {
    indicator.value = { top: anchor.offsetTop, height: anchor.offsetHeight }
  }
}

function update() {
  let current: string | undefined
  for (const id of ids.value) {
    const heading = document.getElementById(id)
    if (!heading) continue
    if (heading.getBoundingClientRect().top > ACTIVE_OFFSET) break
    current = id
  }
  activeId.value = current

  if (props.target) {
    const rect = props.target.getBoundingClientRect()
    progress.value = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)))
  }
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
useResizeObserver(list, placeIndicator)
watch(activeId, () => nextTick(placeIndicator))
onMounted(update)
</script>

<template>
  <nav aria-labelledby="article-toc-title" class="flex max-h-[calc(100dvh-var(--ui-header-height)-4rem)] flex-col gap-4">
    <p id="article-toc-title" class="text-sm font-medium text-highlighted">
      On This Page
    </p>

    <div class="min-h-0 overflow-y-auto [scrollbar-width:thin]">
      <div ref="list" class="relative">
        <span aria-hidden="true" class="absolute inset-y-0 start-px w-px bg-(--ui-border)" />
        <span
          aria-hidden="true"
          class="absolute top-0 start-px w-px bg-inverted/25 transition-[height] duration-300 ease-out motion-reduce:transition-none"
          :style="{ height: activeId ? `${indicator.top}px` : '0px' }"
        />
        <span
          aria-hidden="true"
          class="absolute start-0 w-0.5 rounded-full bg-primary transition-[top,height,opacity] duration-300 ease-out motion-reduce:transition-none"
          :class="activeId ? 'opacity-100' : 'opacity-0'"
          :style="{ top: `${indicator.top}px`, height: `${indicator.height}px` }"
        />

        <ul>
          <li v-for="section in sections" :key="section.id">
            <NuxtLink
              :to="`#${section.id}`"
              :data-heading="section.id"
              :aria-current="activeId === section.id ? 'location' : undefined"
              class="block py-1 ps-4 text-sm text-pretty transition-colors focus-visible:outline-primary"
              :class="activeId === section.id ? 'text-highlighted' : 'text-muted hover:text-default'"
            >
              {{ section.text }}
            </NuxtLink>

            <div
              v-if="section.children.length"
              class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
              :class="openId === section.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              :inert="openId !== section.id"
            >
              <ul class="overflow-hidden">
                <li v-for="child in section.children" :key="child.id">
                  <NuxtLink
                    :to="`#${child.id}`"
                    :data-heading="child.id"
                    :aria-current="activeId === child.id ? 'location' : undefined"
                    class="block py-1 ps-7 text-sm text-pretty transition-colors focus-visible:outline-primary"
                    :class="activeId === child.id ? 'text-highlighted' : 'text-muted hover:text-default'"
                  >
                    {{ child.text }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-default pt-3 text-sm text-muted">
      <span class="flex items-center gap-2">
        <svg viewBox="0 0 16 16" aria-hidden="true" class="size-4 -rotate-90">
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
        <span class="tabular-nums">{{ minutesLeft ? `${minutesLeft} min left` : 'Finished' }}</span>
      </span>
      <UButton
        icon="i-lucide-arrow-up"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Back to Top"
        @click="backToTop"
      />
    </div>
  </nav>
</template>
