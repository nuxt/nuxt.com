<template>
  <div class="relative flex flex-col justify-center">
    <div class="hidden sm:block absolute left-0 w-40 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent z-10" />
    <div class="hidden sm:block absolute right-0 w-40 inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />

    <ClientOnly>
      <Swiper
        v-if="selectedShowcases.length"
        ref="swiper"
        :space-between="30"
        :modules="[Autoplay]"
        :centered-slides="true"
        :slides-per-view="slidesPerView"
        :loop="true"
        :looped-slides="selectedShowcases.length"
        :loop-additional-slides="selectedShowcases.length"
        :autoplay="autoplay"
      >
        <SwiperSlide v-for="(showcase, i) in selectedShowcases" :key="i" :style="{ height: '160px' }">
          <HomeCompaniesCarouselItem :showcase="showcase" />
        </Swiperslide>
      </Swiper>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

import { uniqBy } from 'lodash-es'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
// import required modules
import { Autoplay } from 'swiper'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

const swiper = ref(null)

// swiper autoplay options
const autoplay = { delay: 3000, pauseOnMouseEnter: true, disableOnInteraction: false }

const { smaller } = useBreakpoints(breakpointsTailwind)

const xs = smaller('sm')
const sm = smaller('md')

const slidesPerView = computed(() => {
  if (xs.value) {
    return 1
  } else if (sm.value) {
    return 2
  } else {
    return 3
  }
})

const { list, selectedCategory } = useResourcesShowcases()

const selectedShowcases = computed(() => {
  const flattenedShowcases = list.value?.groups
    ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value?.name)
    ?.map(group => ({
      ...group,
      showcases: group.showcases.map(showcase => ({
        ...showcase
      }))
    }))
    ?.flatMap(group => group.showcases)

  return uniqBy(flattenedShowcases || [], 'id')
})
</script>

<style scoped lang="postcss">
.swiper {
  width: 100%;
  height: 270px;
  padding-top: 40px;
  padding-bottom: 40px;
}
.swiper-slide {
  background-position: center;
  background-size: cover;
  width: 360px;

  :hover {
    cursor: pointer;
  }
}

.swiper-slide-active:has(.host) {
  @apply bg-red-500
}

.swiper-slide-prev:nth-last-of-type(div) {
  @apply hidden
}

.swiper-slide-next:nth-last-of-type(div) {
  @apply hidden
}

.swiper-slide img {
  width: 100%;
  height: 160px;
}
</style>
