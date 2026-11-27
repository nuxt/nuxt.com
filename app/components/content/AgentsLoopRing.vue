<script setup lang="ts">
/**
 * The agent loop as a ring of four steps around the time it takes to build the app. From `md`
 * the steps sit on the ring; below, they move to a grid under it. An arc runs around the ring
 * when motion is allowed. The default slot is the caption.
 */
const props = defineProps<{
  value: string
  label: string
  /** The rank line under the value, e.g. "Median, 3rd of 12". */
  detail?: string
}>()

defineSlots<{ default?: () => unknown }>()

const motion = useAgentsMotion()

const steps = [
  { label: 'Change a file', position: 'left-1/2 top-[11%] -translate-x-1/2 -translate-y-1/2' },
  { label: 'Dev server reports', position: 'right-0 top-1/2 -translate-y-1/2' },
  { label: 'Agent reads it', position: 'left-1/2 top-[89%] -translate-x-1/2 -translate-y-1/2' },
  { label: 'Try again', position: 'left-0 top-1/2 -translate-y-1/2' }
]

const ariaLabel = computed(() => `The agent loop: ${steps.map(s => s.label.toLowerCase()).join(', ')}. ${props.label}: ${props.value}${props.detail ? `, ${props.detail}` : ''}.`)
const pill = 'inline-flex items-center gap-2 h-9 px-3 rounded-full border border-default bg-elevated text-[13px] font-medium text-highlighted whitespace-nowrap'
</script>

<template>
  <figure :aria-label="ariaLabel" class="not-prose m-0 flex flex-col items-center gap-5">
    <div class="relative w-full max-w-130 aspect-square">
      <svg viewBox="0 0 400 400" aria-hidden="true" class="absolute inset-0 size-full overflow-visible">
        <circle
          cx="200"
          cy="200"
          r="156"
          fill="none"
          class="stroke-(--ui-border-accented)"
          stroke-width="1.5"
          stroke-dasharray="2 6"
        />
        <circle
          v-if="motion"
          cx="200"
          cy="200"
          r="156"
          fill="none"
          class="stroke-(--ui-primary)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="140 840"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="-90 200 200"
            to="270 200 200"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="200" cy="200" r="108" class="fill-(--ui-bg-elevated)/50 stroke-(--ui-border)" />
      </svg>

      <span v-for="(step, index) in steps" :key="step.label" aria-hidden="true" class="absolute max-md:hidden" :class="[pill, step.position]">
        <span class="font-mono text-[11px]/none font-medium text-primary">{{ agentsSectionNumber(index) }}</span>
        {{ step.label }}
      </span>

      <div class="absolute inset-[30%] flex flex-col items-center justify-center gap-2 text-center">
        <p class="text-xs font-medium text-muted">
          {{ label }}
        </p>
        <p class="font-heading font-medium text-[clamp(34px,3.6vw,52px)]/none tracking-[-0.04em] text-highlighted whitespace-nowrap">
          {{ value }}
        </p>
        <p v-if="detail" class="text-[13px] font-medium text-toned">
          {{ detail }}
        </p>
      </div>
    </div>

    <ol aria-hidden="true" class="md:hidden w-full m-0 p-0 list-none grid grid-cols-2 gap-2">
      <li v-for="(step, index) in steps" :key="step.label" class="flex items-center gap-2 min-h-11 px-3 rounded-[10px] border border-default bg-elevated text-[13px] font-medium text-highlighted">
        <span class="font-mono text-[11px]/none font-medium text-primary">{{ agentsSectionNumber(index) }}</span>
        {{ step.label }}
      </li>
    </ol>

    <figcaption class="text-sm/normal text-muted [&_p]:my-0 [&_a]:font-medium">
      <slot />
    </figcaption>
  </figure>
</template>
