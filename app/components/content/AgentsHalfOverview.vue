<script setup lang="ts">
import type { AgentsHalf } from '~/utils/agents'

/**
 * The index under the hero: each half with its numbered sections, side by side from `lg`.
 */
defineProps<{
  halves: AgentsHalf[]
}>()
</script>

<template>
  <UContainer as="section" aria-label="What this page covers" class="py-12 lg:py-20">
    <div class="grid lg:grid-cols-2">
      <div
        v-for="(half, i) in halves"
        :key="half.id"
        class="flex flex-col gap-3.5"
        :class="i === 0 ? 'lg:pe-12' : 'max-lg:mt-8 max-lg:pt-8 max-lg:border-t lg:ps-12 lg:border-s border-default'"
      >
        <a
          :href="`#${half.id}`"
          class="self-start flex items-center gap-3 min-h-11 font-mono text-[13px]/none font-medium tracking-[0.08em] uppercase text-muted hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary rounded-sm transition-colors"
        >
          <span class="text-primary">{{ agentsSectionNumber(half.num - 1) }}</span>
          {{ half.when }}
        </a>
        <h2 class="font-heading font-medium text-[clamp(28px,2.6vw,36px)]/[1.1] tracking-[-0.03em] text-highlighted">
          {{ half.title }}
        </h2>
        <ol class="mt-2 border-b border-default">
          <li v-for="(section, index) in half.sections" :key="section.id" class="border-t border-default">
            <a
              :href="`#${section.id}`"
              class="group grid grid-cols-[40px_minmax(0,1fr)_16px] items-center gap-3 min-h-13.5 px-3 text-base font-medium text-highlighted hover:bg-elevated/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary transition-colors"
            >
              <span class="font-mono text-xs/none text-dimmed">{{ agentsSectionNumber(index) }}</span>
              <span>{{ section.label }}</span>
              <UIcon name="i-lucide-arrow-down" class="size-4 text-dimmed transition-transform group-hover:translate-y-0.5 group-hover:text-primary" />
            </a>
          </li>
        </ol>
      </div>
    </div>
  </UContainer>
</template>
