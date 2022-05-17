<template>
  <UContainer padded class="pt-24 pb-36">
    <ClientOnly>
      <Swiper
        :modules="modules"
        :slides-per-view="slidesPerView"
        :loop="true"
        :autoplay="autoplay"
      >
        <SwiperSlide v-for="(item, index) in items" :key="index" class="!h-8">
          <div class="relative flex items-center justify-center h-full">
            <img :src="`/brands/${item.name}.png`" :alt="item.name">
            <NuxtLink :to="item.to" target="_blank" class="absolute inset-0" rel="noopener noreferrer nofollow" />
          </div>
        </SwiperSlide>
      </Swiper>
    </ClientOnly>
  </UContainer>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
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

const { $mq } = useNuxtApp()

const slidesPerView = computed(() => {
  switch ($mq.current) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    case 'md':
      return 3
    default:
      return 5
  }
})
const modules = [Autoplay]
const autoplay = { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>
