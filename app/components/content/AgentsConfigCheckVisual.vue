<script setup lang="ts">
/** Decorative: runtime config values checked one by one, two of them failing. */
const motion = useAgentsMotion()

const checks = [
  { key: 'apiSecret', note: 'required', ok: false, keyTimes: '0;0.1;0.16;0.9;1' },
  { key: 'apiBase', note: '', ok: true, keyTimes: '0;0.2;0.26;0.9;1' },
  { key: 'pageSize', note: 'expected number', ok: false, keyTimes: '0;0.3;0.36;0.9;1' }
]
</script>

<template>
  <div class="h-46 p-5 flex flex-col justify-center gap-2.5 bg-neutral-900/50 font-mono text-xs/none">
    <p class="mb-1 font-medium text-highlighted">
      Invalid runtime config
    </p>
    <div
      v-for="check in checks"
      :key="check.key"
      class="flex items-center gap-2.5 h-6.5 px-2.5 rounded-md border border-default bg-default"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="shrink-0"
        :class="check.ok ? 'stroke-(--ui-text-dimmed)' : 'stroke-(--ui-error)'"
      >
        <g :opacity="motion ? 0 : 1">
          <template v-if="check.ok">
            <path d="M20 6 9 17l-5-5" />
          </template>
          <template v-else>
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </template>
          <animate
            v-if="motion"
            attributeName="opacity"
            values="0;0;1;1;0"
            :keyTimes="check.keyTimes"
            dur="5s"
            repeatCount="indefinite"
          />
        </g>
      </svg>
      <span class="text-highlighted">{{ check.key }}</span>
      <span class="ms-auto text-muted whitespace-nowrap">{{ check.note }}</span>
    </div>
  </div>
</template>
