<template>
  <UContainer padded class="pt-20 pb-16 sm:pb-32">
    <Swiper
      :modules="modules"
      :slides-per-view="slidesPerView"
      :loop="true"
      :autoplay="autoplay"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index" class="!h-8">
        <div class="relative flex items-center justify-center h-full">
          <img :src="`/assets/brands/${item.name}.png`" :alt="item.name">
          <NuxtLink :to="item.to" target="_blank" class="absolute inset-0" rel="noopener noreferrer nofollow" />
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
    type: Array as PropType<Object>,
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
    return 5
  }
})
const modules = [Autoplay]
const autoplay = { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>
