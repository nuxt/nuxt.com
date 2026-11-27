<script setup lang="ts">
/** Decorative chat previews for the Build AI cards. */
defineProps<{
  variant: 'template' | 'components' | 'nuxi'
}>()

const motion = useAgentsMotion()
</script>

<template>
  <div class="min-h-54 flex flex-col justify-between gap-3 p-5 rounded-[10px] border border-default bg-default">
    <template v-if="variant === 'template'">
      <div class="self-end w-[46%] h-7.5 rounded-[10px] bg-accented" />
      <div class="flex flex-col gap-2">
        <div class="w-[88%] h-2.25 rounded-full bg-accented" />
        <div class="w-[74%] h-2.25 rounded-full bg-accented" />
        <div class="w-[52%] h-2.25 rounded-full bg-accented" />
        <svg width="34" height="10" class="block mt-0.5">
          <circle
            v-for="(cx, i) in [5, 17, 29]"
            :key="cx"
            :cx="cx"
            cy="5"
            r="3"
            class="fill-(--ui-text-muted)"
          >
            <animate
              v-if="motion"
              attributeName="opacity"
              values="0.25;1;0.25"
              dur="1.2s"
              :begin="`${i * 0.2}s`"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </template>

    <template v-else-if="variant === 'nuxi'">
      <div class="self-end w-[52%] h-7.5 rounded-[10px] bg-accented" />
      <div class="flex gap-3">
        <AgentNuxiIcon class="shrink-0 size-6 text-primary" :interactive="false" />
        <div class="flex-1 flex flex-col gap-2 pt-1.5">
          <div class="w-[90%] h-2.25 rounded-full bg-accented" />
          <div class="w-[68%] h-2.25 rounded-full bg-accented" />
          <div class="flex gap-1.5 mt-1 font-mono text-[11px]/none text-muted">
            <span class="px-1.5 py-1 rounded-md border border-default">docs</span>
            <span class="px-1.5 py-1 rounded-md border border-default">modules</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-default font-mono text-xs/none font-medium text-muted">
        <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        Reasoning
        <span class="ms-auto text-[11px] text-dimmed">done</span>
      </div>
      <div class="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-default font-mono text-xs/none font-medium text-muted">
        <UIcon name="i-lucide-wrench" class="size-3.5" />
        Tool call
        <UIcon name="i-lucide-loader-circle" class="ms-auto size-3.5 text-primary" :class="{ 'animate-spin': motion }" />
      </div>
      <div class="flex flex-col gap-2 mt-1">
        <div class="w-[84%] h-2.25 rounded-full bg-accented" />
        <div class="w-[62%] h-2.25 rounded-full bg-accented" />
      </div>
    </template>

    <div class="mt-1.5 flex items-center justify-between gap-3 h-10 ps-3.5 pe-1.5 rounded-[10px] border border-default bg-elevated">
      <div class="w-[40%] h-2.25 rounded-full bg-accented" />
      <span class="inline-flex items-center justify-center size-7 rounded-[7px] bg-inverted text-inverted">
        <UIcon name="i-lucide-arrow-up" class="size-3.5" />
      </span>
    </div>
  </div>
</template>
