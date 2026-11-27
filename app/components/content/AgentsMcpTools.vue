<script setup lang="ts">
import mcp from '#build/mcp-tools.mjs'

/**
 * The tools `nuxt.com/mcp` serves, read from `server/mcp/tools/` at build time.
 */
const tools: string[] = mcp.tools
</script>

<template>
  <div class="not-prose flex flex-col gap-3.5 p-6 rounded-2xl border border-default bg-elevated">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-[22px]/[1.25] text-highlighted">
        Tools on nuxt.com/mcp
      </h3>
      <span class="shrink-0 px-2 py-1 rounded-full border border-default font-mono text-xs/none font-medium text-toned">
        {{ tools.length }}
      </span>
    </div>
    <ul class="m-0 p-0 list-none flex flex-wrap gap-1.5">
      <li
        v-for="tool in tools"
        :key="tool"
        class="inline-flex items-center h-6.5 px-2 rounded-md border border-default bg-default font-mono text-xs/none text-toned whitespace-nowrap"
      >
        {{ tool }}
      </li>
    </ul>
  </div>
</template>
