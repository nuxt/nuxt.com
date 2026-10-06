<script setup lang="ts">
defineProps<{
  show: boolean
}>()

const STARS = [
  { class: '-top-1.5 -left-1 size-2.5', delay: 0 },
  { class: '-top-2.5 right-1 size-3.5', delay: 60 },
  { class: 'top-2.5 -right-2 size-2', delay: 120 }
]
</script>

<template>
  <span class="pointer-events-none absolute inset-0" aria-hidden="true">
    <span
      v-for="(star, index) in STARS"
      :key="index"
      class="absolute transition-[opacity,scale] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      :class="[star.class, show ? 'opacity-100 scale-100 duration-300' : 'opacity-0 scale-50 duration-150']"
      :style="{ transitionDelay: show ? `${star.delay}ms` : '0ms' }"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-full fill-current feedback-sparkle"
        :style="{ animationDelay: `${index * 400}ms` }"
      >
        <path d="M12 0C12.8 6.4 17.6 11.2 24 12C17.6 12.8 12.8 17.6 12 24C11.2 17.6 6.4 12.8 0 12C6.4 11.2 11.2 6.4 12 0Z" />
      </svg>
    </span>
  </span>
</template>

<style scoped>
.feedback-sparkle {
  animation: feedback-sparkle 1.6s ease-in-out infinite;
}

@keyframes feedback-sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(0.7) rotate(20deg); opacity: 0.6; }
}

@media (prefers-reduced-motion: reduce) {
  .feedback-sparkle {
    animation: none;
  }
}
</style>
