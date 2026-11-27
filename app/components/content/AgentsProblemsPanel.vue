<script setup lang="ts">
/**
 * The Nuxt 4.7 dev overlay's problems list.
 * The messages are illustrative placeholders until real overlay output replaces them.
 */
const motion = useAgentsMotion()

const filters = ['All', 'Types', 'ESLint', 'Vue', 'Nuxt']

const problems = [
  { level: 'error', source: 'Types', file: 'app/pages/index.vue:14:22', message: 'Property \'titel\' does not exist on type \'Post\'. Did you mean \'title\'?' },
  { level: 'error', source: 'ESLint', file: 'app/components/PostCard.vue:3:7', message: '\'props\' is assigned a value but never used.' },
  { level: 'warning', source: 'Vue', file: 'app/components/PostList.vue:8:5', message: '<template v-for> key should be placed on the <template> tag.' },
  { level: 'warning', source: 'Nuxt', file: 'layers/blog/components/PostCard.vue', message: 'Two components resolve to the same name: PostCard.' }
] as const
</script>

<template>
  <figure class="not-prose m-0 flex flex-col gap-3">
    <div class="rounded-[14px] border border-default bg-elevated overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-default">
        <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-triangle-alert" class="size-4" />
          Problems
        </p>
        <div aria-hidden="true" class="flex flex-wrap gap-1 font-mono text-xs/none font-medium">
          <span
            v-for="(filter, index) in filters"
            :key="filter"
            class="px-2 py-1.5 rounded-md"
            :class="index === 0 ? 'bg-accented text-highlighted' : 'text-muted'"
          >{{ filter }}</span>
        </div>
      </div>

      <div
        v-for="(problem, index) in problems"
        :key="problem.file"
        class="relative flex gap-3 px-4 py-3.5 border-b border-default last:border-b-0"
      >
        <svg v-if="motion" aria-hidden="true" class="absolute left-0 top-0 w-0.5 h-full">
          <rect width="2" height="100%" class="fill-(--ui-primary)" opacity="0">
            <animate
              attributeName="opacity"
              values="0;1;0;0"
              keyTimes="0;0.05;0.25;1"
              dur="4s"
              :begin="`${1 + index * 0.25}s`"
              repeatCount="indefinite"
            />
          </rect>
        </svg>
        <UIcon
          :name="problem.level === 'error' ? 'i-lucide-circle-x' : 'i-lucide-triangle-alert'"
          :aria-label="problem.level === 'error' ? 'Error' : 'Warning'"
          role="img"
          class="shrink-0 mt-0.5 size-4"
          :class="problem.level === 'error' ? 'text-error' : 'text-toned'"
        />
        <div class="min-w-0 flex flex-col gap-1.5">
          <p class="text-sm/normal text-highlighted wrap-anywhere">
            {{ problem.message }}
          </p>
          <p class="flex flex-wrap items-center gap-2 font-mono text-xs/snug text-muted">
            <span class="px-1.5 py-0.5 rounded border border-accented text-toned">{{ problem.source }}</span>
            <span class="wrap-anywhere">{{ problem.file }}</span>
          </p>
        </div>
      </div>
    </div>
    <figcaption class="text-[13px]/normal text-muted">
      Nuxt 4.7 dev overlay, problems list. Messages are illustrative.
    </figcaption>
  </figure>
</template>
