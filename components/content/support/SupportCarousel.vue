<template>
  <UContainer padded class="pt-20 pb-16 sm:pb-32">
    <Swiper
      :modules="modules"
      :slides-per-view="slidesPerView"
      :loop="true"
      :autoplay="autoplay"
      :speed="5000"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index">
        <div class="relative flex items-center justify-center h-full">
          <img :src="`/assets/brands/${item}.svg`" :alt="item" class="h-8">
        </div>
      </SwiperSlide>
    </Swiper>
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
    type: Array as PropType<string[]>,
    default: () => []
  }
})

const { smaller } = useBreakpoints(breakpointsTailwind)

const xs = smaller('sm')
const sm = smaller('md')
const md = smaller('lg')

const slidesPerView = computed(() => {
  if (xs.value) {
    return 1
  } else if (sm.value) {
    return 2
  } else if (md.value) {
    return 3
  } else {
    return 4
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
