<template>
  <UContainer :constrained="false" class="relative pb-16 pt-28">
    <Swiper
      :modules="modules"
      :slides-per-view="slidesPerView"
      :loop="true"
      :autoplay="autoplay"
      :speed="5000"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index" class="flex items-center justify-center h-[60px]">
        <div class="relative flex items-center justify-center h-full">
          <img :src="`/assets/${ !partners ? 'brands' : 'partners' }/${item.name || item}.svg`" :alt="item" class="text-gray-400 dark:text-white" :class="item.height ? `h-[${item.height}px]` : 'h-8'">
        </div>
      </SwiperSlide>
    </Swiper>
    <div class="absolute top-24 left-0 w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] xl:w-[300px] 2xl:w-[400px] h-20 bg-gradient-to-r from-white dark:from-black to-transparent z-[1]" />
    <div class="absolute top-24 right-0 w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] xl:w-[300px] 2xl:w-[400px] h-20 bg-gradient-to-l from-white dark:from-black to-transparent z-[1]" />
  </UContainer>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

// Import Swiper styles
import 'swiper/css'

defineProps({
  items: {
    type: Array as PropType<Object>,
    default: () => []
  },
  partners: {
    type: Boolean,
    default: false
  }
})

const { smaller } = useBreakpoints(breakpointsTailwind)

const xs = smaller('sm')
const sm = smaller('md')
const md = smaller('lg')
const lg = smaller('xl')

const slidesPerView = computed(() => {
  if (xs.value || sm.value) {
    return 2
  } else if (md.value) {
    return 3
  } else if (lg.value) {
    return 4
  } else {
    return 5
  }
})
const modules = [Autoplay]
const autoplay = { delay: 1, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>

<style>
.swiper-wrapper {
  transition-timing-function: linear !important;
}

.swiper-slide {
  height: 60px;
}
</style>
