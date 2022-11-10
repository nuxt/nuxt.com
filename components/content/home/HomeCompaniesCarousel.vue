<template>
  <div class="relative flex flex-col justify-center">
    <div class="hidden sm:block absolute left-0 w-20 inset-y-0 bg-gradient-to-r from-white via-white dark:via-black dark:from-black to-transparent z-10" />
    <div class="hidden sm:block absolute right-0 w-20 inset-y-0 bg-gradient-to-l from-white via-white dark:via-black dark:from-black to-transparent z-10" />

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
        :speed="1000"
        :slide-to-clicked-slide="false"
        @slideChangeTransitionEnd="slideChangeTransitionEnd"
        @slideNextTransitionStart="slideNextTransitionStart"
        @click="click"
      >
        <SwiperSlide v-for="(showcase, i) in selectedShowcases" :key="i" :style="{ height: '160px' }">
          <Component :is="transition.end === true && realIndex === i ? 'a' : 'div'" :href="showcase.url" target="_blank">
            <div class="absolute inset-0 z-10 opacity-70 backdrop-blur-[2px] u-bg-white transition-opacity duration-300" :class="transition.end === true && realIndex === i ? '-z-[1] blur-[8px] u-bg-gray-900 opacity-100' : 'opacity-70 backdrop-blur-[2px] u-bg-white'" />

            <img
              :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_420,h_315/${showcase.screenshotUrl}`"
              :alt="showcase.hostname"
              loading="lazy"
              class="object-cover object-top w-full h-full px-4 sm:px-0"
              height="315"
              width="420"
            >
            <div class="px-4 py-3 text-center content transition-opacity duration-300" :class="transition.end === true ? 'opacity-100' : 'opacity-0'">
              <h2 class="font-semibold truncate u-text-gray-900 text-xl">
                {{ showcase.title || showcase.hostname }}
              </h2>
              <p class="truncate text-green-400">
                {{ showcase.hostname }}
              </p>
            </div>
          </Component>
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
const realIndex = ref(0)
const activeIndex = ref(0)

// swiper autoplay options
const autoplay = { delay: 3000, pauseOnMouseEnter: false, disableOnInteraction: false }

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

const transition = reactive({ end: false })

const slideChangeTransitionEnd = (swiper) => {
  transition.end = true
  realIndex.value = swiper.realIndex
  activeIndex.value = swiper.activeIndex
}

const slideNextTransitionStart = () => {
  transition.end = false
}

const click = (swiper) => {
  if (swiper.clickedIndex < activeIndex.value) {
    swiper.slidePrev()
  } else if (swiper.clickedIndex > activeIndex.value) {
    swiper.slideNext()
  }
}

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

.slide {
  @apply absolute inset-0 z-10 opacity-70 backdrop-blur-[2px] u-bg-white
}

.swiper-slide-active > a > .content {
  @apply block
}

.content {
  @apply hidden
}
</style>
