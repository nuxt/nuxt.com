<script setup lang="ts">
/** Decorative: the three suites the evals cover. */
const motion = useAgentsMotion()

const suites = ['Nuxt', 'Nuxt UI', 'Nuxt Content']
</script>

<template>
  <div aria-hidden="true" class="not-prose grid grid-cols-3 gap-2">
    <div
      v-for="(suite, index) in suites"
      :key="suite"
      class="flex flex-col items-center justify-center gap-2.5 min-h-23 px-1.5 py-3 rounded-xl border border-default bg-default font-mono text-xs/tight font-medium text-highlighted text-center"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-(--ui-text-muted)"
      >
        <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
        <path d="M6.453 15h11.094" />
        <path d="M8.5 2h7" />
        <circle
          v-if="motion"
          cx="10"
          cy="18"
          r="1"
          stroke="none"
          class="fill-(--ui-primary)"
        >
          <animate attributeName="cy" values="19;12;19" dur="2.4s" :begin="`${index * 0.8}s`" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="2.4s" :begin="`${index * 0.8}s`" repeatCount="indefinite" />
        </circle>
      </svg>
      {{ suite }}
    </div>
  </div>
</template>
