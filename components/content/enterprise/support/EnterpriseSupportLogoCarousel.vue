<script lang="ts" setup>
const { logos } = defineProps({
  logos: {
    type: Array<{ src: string, width: number, height: number, alt: string }>,
    require: true
  }
})

const carousel = ref<HTMLElement>(null)
</script>

<template>
  <div class="overflow-hidden whitespace-nowrap relative h-12">
    <div class="h-12 w-[400px] bg-gradient-to-r from-white dark:from-slate-950 via-transparent to-transparent absolute left-0 z-10" />
    <div class="h-12 w-[400px] bg-gradient-to-r to-white dark:to-slate-950 via-transparent from-transparent absolute right-0 z-10" />
    <div ref="carousel" class="flex carousel">
      <div v-for="(logo, index) in logos.concat(logos)" :key="index" class="carousel-item">
        <img :src="logo.src" :width="logo.width" :height="logo.height" :alt="logo.alt">
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.carousel {
  animation: scroll 20s linear infinite;
}

.carousel-item {
  flex: 0 0 auto;
  margin-right: 58px;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% - 80px));
  }
}
</style>
