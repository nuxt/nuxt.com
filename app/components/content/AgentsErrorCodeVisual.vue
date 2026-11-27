<script setup lang="ts">
/** Decorative: an error with a stable code, then its why and fix filling in. */
const motion = useAgentsMotion()
</script>

<template>
  <div class="h-46 px-6 flex flex-col justify-center gap-3.5 bg-neutral-900/50 font-mono text-xs/none">
    <div class="flex items-center gap-2.5">
      <span class="px-1.5 py-1 rounded bg-error/15 text-error font-medium">ERROR</span>
      <span class="px-2 py-1 rounded border border-accented text-highlighted font-medium">NUXT_E1001</span>
    </div>
    <div v-for="row in [{ label: 'why', width: 86, color: 'fill-(--ui-border-accented)', values: '0%;86%;86%;0%', keyTimes: '0;0.25;0.9;1' }, { label: 'fix', width: 62, color: 'fill-(--ui-text-dimmed)', values: '0%;0%;62%;62%;0%', keyTimes: '0;0.2;0.45;0.9;1' }]" :key="row.label" class="flex items-center gap-3">
      <span class="w-7 text-muted">{{ row.label }}</span>
      <svg height="8" class="flex-1">
        <rect width="100%" height="8" rx="4" class="fill-neutral-800/60" />
        <rect height="8" rx="4" :class="row.color" :width="`${row.width}%`">
          <animate
            v-if="motion"
            attributeName="width"
            :values="row.values"
            :keyTimes="row.keyTimes"
            dur="5s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  </div>
</template>
