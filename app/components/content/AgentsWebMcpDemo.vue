<script setup lang="ts">
/** A product page: the agent can call addToCart only for products a user could add. */
const motion = useAgentsMotion()
</script>

<template>
  <figure aria-label="A product page: the agent can call addToCart only for products a user could add" class="not-prose m-0 mt-2 rounded-[14px] border border-default bg-elevated overflow-hidden">
    <div aria-hidden="true" class="flex items-center gap-3 h-10 px-3.5 border-b border-default">
      <span class="flex gap-1.5">
        <span v-for="i in 3" :key="i" class="size-2 rounded-full bg-accented" />
      </span>
      <span class="flex-1 max-w-55 h-5 rounded-full border border-default bg-default" />
    </div>
    <div aria-hidden="true" class="flex flex-col gap-2.5 p-3.5">
      <div class="flex items-center gap-3 p-2.5 rounded-[10px] border border-default bg-default">
        <span class="shrink-0 size-10 rounded-lg bg-accented" />
        <span class="flex-1 min-w-0 flex flex-col gap-1.5">
          <span class="w-[70%] h-2 rounded-full bg-(--ui-border-accented)" />
          <span class="w-[40%] h-1.5 rounded-full bg-accented" />
        </span>
        <span class="relative shrink-0 inline-flex items-center h-7 px-3 rounded-[7px] bg-primary text-[#0A0A0A] text-xs/none font-semibold">
          Add
          <svg class="absolute -inset-1 size-[calc(100%+8px)] overflow-visible">
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              rx="10"
              fill="none"
              class="stroke-(--ui-primary)"
              stroke-width="1.5"
              :opacity="motion ? 0 : 1"
            >
              <animate
                v-if="motion"
                attributeName="opacity"
                values="0;0;1;0;0"
                keyTimes="0;0.35;0.45;0.7;1"
                dur="4s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </span>
      </div>
      <div class="flex items-center gap-3 p-2.5 rounded-[10px] border border-default bg-default">
        <span class="shrink-0 size-10 rounded-lg bg-accented" />
        <span class="flex-1 min-w-0 flex flex-col gap-1.5">
          <span class="w-[56%] h-2 rounded-full bg-(--ui-border-accented)" />
          <span class="text-[11px]/none text-muted">Out of stock</span>
        </span>
        <span class="shrink-0 inline-flex items-center h-7 px-3 rounded-[7px] bg-accented text-dimmed text-xs/none font-semibold">Add</span>
      </div>
    </div>
    <div aria-hidden="true" class="flex flex-col gap-2 px-3.5 pt-3 pb-3.5 border-t border-dashed border-default font-mono text-xs/snug">
      <span class="text-muted">Tools on this page</span>
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="inline-flex items-center gap-2 h-7 px-2.5 rounded-[7px] border border-accented bg-default text-highlighted">
          <svg width="8" height="8">
            <circle cx="4" cy="4" r="4" class="fill-(--ui-primary)" :opacity="motion ? 0.25 : 1">
              <animate
                v-if="motion"
                attributeName="opacity"
                values="0.25;0.25;1;1;0.25"
                keyTimes="0;0.3;0.38;0.7;1"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          addToCart(sku: string)
        </span>
        <span class="text-dimmed">only for buttons a user could click</span>
      </div>
    </div>
  </figure>
</template>
