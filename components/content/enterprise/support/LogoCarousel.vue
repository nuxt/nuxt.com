<template>
  <div class="carousel-container relative h-12">
    <div class="h-12 w-[400px] bg-gradient-to-r from-slate-950 via-transparent to-transparent absolute left-0 z-10" />
    <div class="h-12 w-[400px] bg-gradient-to-r to-slate-950 via-transparent from-transparent absolute right-0 z-10" />
    <div ref="carousel" class="carousel">
      <div v-for="(logo, index) in logos" :key="index" class="carousel-item">
        <img :src="logo.src" :width="logo.width" :height="logo.height" :alt="'Logo ' + (index + 1)">
      </div>
      <div v-for="(logo, index) in logos" :key="'duplicate-' + index" class="carousel-item">
        <img :src="logo.src" :width="logo.width" :height="logo.height" :alt="'Logo ' + (index + 1)">
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { logos } = defineProps({
  logos: {
    type: Array<{ src: string, width: number, height: number }>,
    require: true
  }
})

const carousel = ref(null)

onMounted(() => {
  const itemWidth = carousel.value.querySelector('.carousel-item').offsetWidth
  const marginRight = parseInt(getComputedStyle(carousel.value.querySelector('.carousel-item')).marginRight)
  const carouselWidth = (itemWidth + marginRight) * logos.length
  carousel.value.style.setProperty('--carousel-width', `${carouselWidth}px`)
})
</script>

<style scoped lang="postcss">
.carousel-container {
  overflow: hidden;
  white-space: nowrap;
}

.carousel {
  display: flex;
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
