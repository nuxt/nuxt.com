<script setup lang="ts">
/** Decorative: a source-mapped code frame with the failing line marked, and its copy button. */
const motion = useAgentsMotion()
</script>

<template>
  <div class="h-46 px-5 pt-5 pb-4 flex flex-col justify-between gap-3 bg-neutral-900/50">
    <code class="block overflow-hidden whitespace-pre font-mono text-xs/[1.8] text-dimmed">
      <span class="block">{{ '  12 │ const post = await getPost(id)' }}</span>
      <span class="block text-highlighted"><span class="text-error">❯</span>{{ ' 13 │ return post.' }}<span class="relative inline-block">titel<svg width="100%" height="6" viewBox="0 0 40 6" preserveAspectRatio="none" class="absolute left-0 -bottom-1 overflow-visible"><path
        d="M0 3 Q2.5 0 5 3 T10 3 T15 3 T20 3 T25 3 T30 3 T35 3 T40 3"
        fill="none"
        class="stroke-(--ui-error)"
        stroke-width="1.2"
        stroke-dasharray="60"
        :stroke-dashoffset="motion ? 60 : 0"
      ><animate
        v-if="motion"
        attributeName="stroke-dashoffset"
        values="60;0;0;60"
        keyTimes="0;0.25;0.85;1"
        dur="4s"
        repeatCount="indefinite"
      /></path></svg></span>.trim()</span>
      <span class="block">{{ '  14 │ }' }}</span>
    </code>
    <div class="flex items-center justify-between gap-2">
      <span class="font-mono text-[11px]/none text-dimmed truncate">server/api/posts/[slug].get.ts</span>
      <span class="shrink-0 inline-flex items-center gap-1.5 h-6.5 px-2 rounded-md border border-default text-xs/none font-medium text-muted">
        <UIcon name="i-lucide-copy" class="size-3" />
        Copy as prompt
      </span>
    </div>
  </div>
</template>
