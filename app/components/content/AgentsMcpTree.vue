<script setup lang="ts">
import mcp from '#build/mcp-tools.mjs'

/**
 * The folders of `server/mcp/` (read at build time), and the server they become.
 */
const motion = useAgentsMotion()

const kinds = computed(() => (['tools', 'resources', 'prompts'] as const)
  .map(kind => ({ kind, dirs: mcp.dirs[kind] }))
  .filter(({ dirs }) => dirs.length))
</script>

<template>
  <figure aria-label="Files in server/mcp become the server at nuxt.com/mcp" class="not-prose m-0 p-4.5 rounded-[14px] border border-default bg-elevated font-mono text-[13px]/none">
    <div class="flex flex-col gap-2.5">
      <span class="flex items-center gap-2 text-highlighted">
        <UIcon name="i-lucide-folder" class="size-3.5" />
        server/mcp/
      </span>
      <div class="flex flex-col gap-2 ms-1.5 ps-5.5 border-s border-default">
        <div v-for="{ kind, dirs } in kinds" :key="kind" class="flex flex-wrap items-center gap-1.5">
          <span class="w-23 text-toned">{{ kind }}/</span>
          <span v-for="dir in dirs" :key="dir" class="px-1.5 py-1 rounded-[5px] border border-default bg-default text-xs/none text-muted">{{ dir }}</span>
        </div>
      </div>
      <div aria-hidden="true" class="flex items-center gap-2.5 mt-1">
        <svg width="40" height="28" class="shrink-0 overflow-visible">
          <path d="M6 0 V14 H40" fill="none" class="stroke-(--ui-border-accented)" stroke-width="1.5" stroke-dasharray="3 4" />
          <circle v-if="motion" r="3" class="fill-(--ui-primary)">
            <animateMotion path="M6 0 V14 H40" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </svg>
        <span class="inline-flex items-center h-7.5 px-2.5 rounded-[7px] border border-primary bg-primary/8 text-highlighted">https://nuxt.com/mcp</span>
      </div>
    </div>
  </figure>
</template>
