<script setup lang="ts">
import type { Nuxter } from '#shared/types'
import { NUXTERS_CORE_MULTIPLIER, NUXTERS_CORE_REPOS, nuxterScoreBreakdown } from '#shared/utils/nuxters'

const props = defineProps<{
  nuxter: Nuxter
}>()

const { format } = new Intl.NumberFormat('en-US')
const rows = computed(() => nuxterScoreBreakdown(props.nuxter))
const base = computed(() => rows.value.filter(row => !row.bonus))
const bonus = computed(() => rows.value.filter(row => row.bonus))
// One scale for both groups, so the bars compare.
const max = computed(() => Math.max(1, ...rows.value.map(row => row.total)))
const coreRepos = NUXTERS_CORE_REPOS.join(', ')
</script>

<template>
  <UModal title="How is the score calculated?" description="Each contribution type has a weight. Merged PRs weigh the most.">
    <slot>
      <UButton
        icon="i-lucide-info"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Show score breakdown"
      />
    </slot>

    <template #body>
      <div class="flex flex-col items-center gap-1 py-4 rounded-md bg-elevated/50 mb-6">
        <span class="text-4xl font-bold tabular-nums">{{ format(nuxter.score) }}</span>
        <span class="text-sm text-muted">total points</span>
      </div>

      <ul class="flex flex-col gap-3">
        <li v-for="row in base" :key="row.key" class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2">
              <UIcon :name="row.icon" class="size-4 text-muted" />
              {{ row.label }}
            </span>
            <span class="tabular-nums text-muted">
              {{ format(row.amount) }} × {{ row.multiplier }} = <span class="font-medium text-highlighted">{{ format(row.total) }}</span>
            </span>
          </div>
          <UProgress :model-value="row.total" :max="max" size="xs" />
        </li>
      </ul>

      <div class="mt-6 pt-6 border-t border-default">
        <p class="flex items-center gap-2 text-sm font-medium text-highlighted">
          <UIcon name="i-lucide-sparkles" class="size-4 text-primary" />
          Core bonus
        </p>
        <p class="text-sm text-muted mt-1 mb-4">
          Merged PRs, helpful issues and helpful comments in {{ coreRepos }} count {{ NUXTERS_CORE_MULTIPLIER === 2 ? 'double' : `${NUXTERS_CORE_MULTIPLIER} times` }}.
        </p>

        <ul v-if="bonus.length" class="flex flex-col gap-3">
          <li v-for="row in bonus" :key="row.key" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="flex items-center gap-2">
                <UIcon :name="row.icon" class="size-4 text-muted" />
                {{ row.label }}
              </span>
              <span class="tabular-nums text-muted">
                {{ format(row.amount) }} × {{ row.multiplier }} = <span class="font-medium text-highlighted">+{{ format(row.total) }}</span>
              </span>
            </div>
            <UProgress :model-value="row.total" :max="max" size="xs" color="secondary" />
          </li>
        </ul>
        <p v-else class="text-sm text-dimmed">
          No core contributions yet.
        </p>
      </div>
    </template>
  </UModal>
</template>
