<template>
  <UContainer padded class="pt-12 pb-36">
    <Swiper
      :modules="modules"
      :slides-per-view="5"
      :space-between="68"
      :loop="true"
      :autoplay="autoplay"
    >
      <SwiperSlide v-for="(item, index) in items" :key="index" class="!h-8">
        <div class="relative flex items-center h-full">
          <img :src="`/brands/${item.name}.png`" :alt="item.name">
          <NuxtLink :to="item.to" target="_blank" class="absolute inset-0" rel="noopener noreferrer nofollow" />
        </div>
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
