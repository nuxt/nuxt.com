<script setup lang="ts">
withDefaults(defineProps<{
  /** Panel footer row — matches page context bar padding and border */
  bar?: boolean
}>(), {
  bar: false
})

// `false` only in local `--ui-only` dev mode, where the Eve runtime is not spawned.
const eveEnabled = useRuntimeConfig().public.eveEnabled !== false
</script>

<template>
  <div
    v-if="!eveEnabled"
    class="flex w-full items-center gap-3 text-xs text-dimmed"
    :class="bar ? 'border-b border-default px-4 py-2.5' : 'py-1'"
  >
    <UIcon name="i-lucide-power-off" class="size-3.5 shrink-0" />
    <span class="min-w-0 flex-1">
      Nuxi agent is disabled in <code class="font-mono text-default">--ui-only</code> dev mode.
      Run <code class="font-mono text-default">pnpm dev:nuxi</code> with an <code class="font-mono text-default">AI_GATEWAY_API_KEY</code> to enable it.
    </span>
  </div>
</template>
