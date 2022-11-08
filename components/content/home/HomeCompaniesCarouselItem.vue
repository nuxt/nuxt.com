<template>
  <NuxtLink :to="showcase.url" target="_blank">
    <div class="slide hidden sm:block" />

    <img
      :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_327,h_160/${showcase.screenshotUrl}`"
      :alt="showcase.hostname"
      loading="lazy"
      class="object-cover object-top w-full h-full px-4 sm:px-0"
      height="160"
      width="327"
    >
    <div class="px-4 py-3 text-center content">
      <h2 class="font-semibold truncate u-text-gray-900 text-xl">
        {{ showcase.title || showcase.hostname }}
      </h2>
      <p class="truncate text-green-400">
        {{ showcase.hostname }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">import { PropType } from 'vue'
import { ResourcesShowcasesListGroupItem } from '~~/types'

const props = defineProps({
  showcase: {
    type: Object as PropType<ResourcesShowcasesListGroupItem>,
    required: true
  },
  activeIndex: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped lang="postcss">
.slide {
  @apply absolute inset-0 z-10 opacity-70 backdrop-blur-[2px] u-bg-white
}

.swiper-slide-active > a > .slide {
  @apply -z-[1] blur-[8px] u-bg-gray-900 opacity-100
}

.swiper-slide-active {
  @apply border
}

.swiper-slide-active > a > .content {
  @apply block
}

.content {
  @apply hidden
}

</style>
