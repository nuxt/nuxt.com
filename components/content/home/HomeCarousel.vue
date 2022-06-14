<template>
  <UContainer :constrained="false" class="relative pb-16 pt-28">
    <Swiper
      :modules="modules"
      :slides-per-view="slidesPerView"
      :loop="true"
      :autoplay="autoplay"
      :speed="5000"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index" class="!h-8">
        <div class="relative flex items-center justify-center h-full">
          <img :src="`/assets/brands/${item.name}.png`" :alt="item.name">
          <NuxtLink :to="item.to" target="_blank" class="absolute inset-0" rel="noopener noreferrer nofollow" />
        </div>
      </SwiperSlide>
    </Swiper>
    <div class="absolute top-0 left-0 w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] xl:w-[300px] 2xl:w-[400px] h-full bg-gradient-to-r from-white dark:from-black to-transparent z-[1]" />
    <div class="absolute top-0 right-0  w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] 2xl:w-[400px] h-full bg-gradient-to-l from-white dark:from-black to-transparent z-[1]" />
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
    return 5
  } else {
    return 6
  }
})
const modules = [Autoplay]
const autoplay = { delay: 1, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>

<style>
.swiper-wrapper {
  transition-timing-function: linear !important;
}
</style>
