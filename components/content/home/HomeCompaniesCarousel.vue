<template>
  <div class="relative flex flex-col justify-center">
    <div class="absolute left-0 w-40 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent z-10" />
    <div class="absolute right-0 w-40 inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />
    <!-- Workaround for nuxtlabs/nuxt.com#566 -->
    <Swiper
      v-if="selectedShowcases.length"
      ref="{swiperRef}"
      :centered-slides="true"
      :slide-to-clicked-slide="true"
      :slides-per-view="5"
      :loop="true"
      :modules="[Pagination]"
      :looped-slides="5"
      :loop-additional-slides="5"
    >
      <SwiperSlide v-for="(slide, i) in selectedShowcases" :key="i" class="mx-4 relative" :style="{ height: '200px' }">
        <img
          :src="slide.url"
          class="object-cover w-full h-full rounded-md flex-1"
          alt="A showcase"
        >
        <div class="absolute -bottom-8 inset-x-0 flex justify-center">
          <div>Link</div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { uniqBy } from 'lodash-es'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
// import required modules
import { Pagination } from 'swiper'

const { list, selectedCategory } = useResourcesShowcases()

// Computed
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

<style scoped>
.swiper {
  width: 100%;
  padding-top: 40px;
  padding-bottom: 40px;
}
.swiper-slide {
  background-position: center;
  background-size: cover;
  width: 400px;
  filter: blur(0px);
  :hover {
    cursor: pointer;
  }
}

.swiper-slide img {
  width: 100%;
  height: 200px;
}
</style>
