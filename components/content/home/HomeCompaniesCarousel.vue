<template>
  <div class="relative flex flex-col justify-center">
    <div class="absolute left-0 w-40 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent z-10" />
    <div class="absolute right-0 w-40 inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />

    <Swiper
      v-if="selectedShowcases.length"
      :space-between="30"
      :modules="[Autoplay]"
      :centered-slides="true"
      :slides-per-view="4"
      :loop="true"
      :looped-slides="selectedShowcases.length"
      :loop-additional-slides="selectedShowcases.length"
      :autoplay="autoplay"
    >
      <SwiperSlide v-for="(showcase, i) in selectedShowcases" :key="i" :style="{ height: '200px' }">
        <div class="slide" />
        <NuxtLink>
          <img
            :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
            :alt="showcase.hostname"
            loading="lazy"
            class="object-cover object-top w-full h-full rounded-md"
          >
          <div class="px-4 py-3 text-center">
            <h2 class="font-semibold truncate u-text-gray-900 text-xl">
              {{ showcase.title || showcase.hostname }}
            </h2>
            <p class="truncate text-green-400">
              {{ showcase.hostname }}
            </p>
          </div>
        </nuxtlink>
      </Swiperslide>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { uniqBy } from 'lodash-es'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
// import required modules
import { Autoplay } from 'swiper'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

// swiper autoplay options
const autoplay = { delay: 2000, pauseOnMouseEnter: true, disableOnInteraction: false }

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
  height: 300px;
  padding-top: 40px;
  padding-bottom: 40px;
}
.swiper-slide {
  background-position: center;
  background-size: cover;
  width: 400px;
  filter: blur(px);

  :hover {
    cursor: pointer;
  }
}

.swiper-slide-active > .slide {
  @apply -z-[1] blur-[8px] u-bg-gray-900 opacity-100
}

.slide {
  @apply absolute inset-0 z-10 opacity-70 backdrop-blur-sm u-bg-white
}

.swiper-slide img {
  width: 100%;
  height: 200px;
}
</style>
