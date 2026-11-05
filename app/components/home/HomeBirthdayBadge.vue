<script setup lang="ts">
const badge = useTemplateRef('badge')
const { celebrate, startHoverCelebrate, cancelHoverCelebrate } = useNuxtBirthday()

const candles = [
  { x: -5, y: 1.6, color: '#60A5FA', delay: '-0.5s' },
  { x: 0, y: 0, color: '#00DC82', delay: '0s' },
  { x: 5, y: 1.6, color: '#A78BFA', delay: '-0.9s' }
]
</script>

<template>
  <button
    ref="badge"
    type="button"
    class="group cursor-pointer"
    @mouseenter="startHoverCelebrate(badge)"
    @mouseleave="cancelHoverCelebrate"
    @click="celebrate(badge)"
  >
    <UBadge
      variant="subtle"
      color="neutral"
      size="lg"
      class="gap-2 px-3 rounded-full font-semibold bg-pink-500/10 text-pink-600 ring-pink-500/25 transition-colors group-hover:bg-pink-500/15 group-hover:ring-pink-500/40 dark:text-pink-300"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-5 -my-1 shrink-0 origin-bottom transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none"
        data-confetti-origin
        aria-hidden="true"
      >
        <g
          v-for="candle in candles"
          :key="candle.color"
          :transform="`translate(${candle.x} ${candle.y})`"
        >
          <g class="cake-flame" :style="{ animationDelay: candle.delay }">
            <path d="M12 1.2C13.6 3 14.2 4.1 14.2 5.1a2.2 2.2 0 0 1-4.4 0c0-1 .6-2.1 2.2-3.9Z" fill="#FBBF24" />
            <path d="M12 3.4c.7.8 1 1.3 1 1.8a1 1 0 0 1-2 0c0-.5.3-1 1-1.8Z" fill="#FEF3C7" />
          </g>
          <rect
            x="11"
            y="7.2"
            width="2"
            height="4.8"
            rx=".6"
            :fill="candle.color"
          />
          <path d="M11 9.4l2-1v1.2l-2 1Z" fill="#fff" fill-opacity=".7" />
        </g>
        <rect
          x="4"
          y="11.5"
          width="16"
          height="9"
          rx="2"
          fill="#F472B6"
        />
        <path d="M4 13.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v1c-.8.9-1.7.9-2.5 0-.8.9-1.7.9-2.5 0-.8.9-1.7.9-2.5 0-.8.9-1.7.9-2.5 0-.8.9-1.7.9-2.5 0-.8.9-1.6.9-2 .5Z" fill="#FDF2F8" />
        <circle cx="7.5" cy="17.5" r=".8" fill="#FBBF24" />
        <circle cx="12" cy="18.5" r=".8" fill="#00DC82" />
        <circle cx="16.5" cy="17" r=".8" fill="#60A5FA" />
        <rect
          x="2"
          y="20.3"
          width="20"
          height="1.7"
          rx=".85"
          fill="currentColor"
          fill-opacity=".45"
        />
      </svg>
      10 years of Nuxt!
    </UBadge>
  </button>
</template>

<style scoped>
.cake-flame {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: cake-flicker 1.4s ease-in-out infinite;
}

@keyframes cake-flicker {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(0.92, 1.08) rotate(-4deg); }
  50% { transform: scale(1.05, 0.94) rotate(2deg); }
  75% { transform: scale(0.96, 1.05) rotate(4deg); }
}

@media (prefers-reduced-motion: reduce) {
  .cake-flame {
    animation: none;
  }
}
</style>
