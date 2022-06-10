<template>
  <div>
    <!-- Workaround for nuxtlabs/nuxt.com#566 -->
    <ClientOnly>
      <Swiper
        :effect="'coverflow'"
        :centered-slides="true"
        :slide-to-clicked-slide="true"
        :slides-per-view="'auto'"
        :pagination="true"
        :coverflow-effect="{
          rotate: 0,
          stretch: 80,
          depth: 200,
          modifier: 1,
          slideShadows: false
        }"
        :initial-slide="2"
        :modules="[EffectCoverflow, Pagination]"
      >
        <SwiperSlide v-for="(slide, i) in showcases" :key="i">
          <img
            :src="slide"
            class="object-cover w-full h-full rounded-md"
            alt="A showcase"
          >
        </SwiperSlide>
      </Swiper>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

// import required modules
import { EffectCoverflow, Pagination } from 'swiper'

const showcases = ref([
  '/assets/docs/framework/v2/showcase-1.png',
  '/assets/docs/framework/v2/showcase-2.png',
  '/assets/docs/framework/v2/showcase-3.png',
  '/assets/docs/framework/v2/showcase-4.png',
  '/assets/docs/framework/v2/showcase-5.png'
])
</script>

<style scoped>
.swiper {
  width: 100%;
  padding-top: 40px;
  padding-bottom: 40px;
}

.swiper-slide-prev,
.swiper-slide-next {
  filter: blur(1px);
}
.swiper-slide-active {
  filter: blur(0px);
}
.swiper-slide img {
  display: block;
  width: 100%;
}

</style>
