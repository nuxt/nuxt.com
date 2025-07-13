<script lang="ts" setup>
interface Logo {
  src: string
  width: number
  height: number
  alt: string
  light: string
  dark: string
}

const { logos } = defineProps({
  logos: {
    type: Array as () => Logo[],
    required: true
  }
})

const carousel = useTemplateRef('carousel')

const stopAnimation = () => {
  if (carousel.value) {
    carousel.value.style.animationPlayState = 'paused'
  }
}

const startAnimation = () => {
  if (carousel.value) {
    carousel.value.style.animationPlayState = 'running'
  }
}
</script>

<template>
  <div class="overflow-hidden whitespace-nowrap relative h-12">
    <div class="h-12 w-[50px] sm:w-[100px] md:w-[200px] lg:w-[400px] bg-gradient-to-r from-white dark:from-slate-950 via-transparent to-transparent absolute left-0 z-10" />
    <div class="h-12 w-[50px]sm:w-[100px] md:w-[200px] lg:w-[400px] bg-gradient-to-r to-white dark:to-slate-950 via-transparent from-transparent absolute right-0 z-10" />
    <div
      ref="carousel"
      class="flex carousel"
      @mouseover="stopAnimation"
      @mouseleave="startAnimation"
    >
      <div v-for="({ light, dark, width, height, alt }, index) in logos ? [...logos, ...logos] : []" :key="index" class="carousel-item items-center">
        <UColorModeImage :light="light" :dark="dark" :width="width" :height="height" :alt="alt" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.carousel {
  animation: scroll 30s linear infinite;
  animation-play-state: running;
}

.carousel-item {
  flex: 0 0 auto;
  margin-right: 68px;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-166%));
  }
}
</style>
