<script setup lang="ts">
/** Decorative: your agent and nuxt.com/mcp, with a request going out and a response coming back. */
const motion = useAgentsMotion()
const patternId = useId()
</script>

<template>
  <div aria-hidden="true" class="relative flex items-center gap-3 px-4 py-3.5 rounded-xl border border-default bg-default overflow-hidden">
    <svg class="absolute inset-0 size-full pointer-events-none">
      <defs>
        <pattern :id="patternId" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" class="fill-neutral-800/60" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
    </svg>
    <span class="relative shrink-0 inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-accented bg-elevated text-[13px]/none font-medium text-highlighted">
      <UIcon name="i-lucide-square-terminal" class="size-3.5" />
      Your agent
    </span>
    <svg height="12" class="relative flex-1 min-w-10 overflow-visible">
      <line
        x1="0"
        y1="6"
        x2="100%"
        y2="6"
        class="stroke-(--ui-border-accented)"
        stroke-width="1.5"
        stroke-dasharray="3 5"
      />
      <template v-if="motion">
        <circle cy="4" r="3" class="fill-(--ui-primary)">
          <animate attributeName="cx" values="0%;100%" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cy="8" r="3" class="fill-(--ui-text-highlighted)">
          <animate attributeName="cx" values="100%;0%" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.9;1"
            dur="1.8s"
            begin="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </template>
    </svg>
    <span class="relative shrink-0 inline-flex items-center h-8 px-3 rounded-lg border border-primary bg-primary/8 font-mono text-[13px]/none font-medium text-highlighted">
      nuxt.com/mcp
    </span>
  </div>
</template>
