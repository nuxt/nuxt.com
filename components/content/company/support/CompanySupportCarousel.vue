<template>
  <UContainer padded class="pt-12 pb-36">
    <Swiper
      :modules="modules"
      :slides-per-view="6"
      :space-between="68"
      :loop="true"
      :autoplay="autoplay"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index" class="relative">
        <img :src="`/company/support/showcases/${item.name}.png`" :alt="item.name">
        <NuxtLink :to="item.to" target="_blank" class="absolute inset-0" rel="noopener noreferrer nofollow" />
      </SwiperSlide>
    </Swiper>
  </UContainer>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper'

// Import Swiper styles
import 'swiper/css'

defineProps({
  items: {
    type: Array as PropType<Object>,
    default: () => []
  }
})

const modules = [Autoplay]
const autoplay = { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>
