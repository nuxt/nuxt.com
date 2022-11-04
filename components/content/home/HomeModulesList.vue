
<template>
  <UContainer :constrained="false" class="relative pb-16 pt-28">
      <Swiper
        v-for="(swiper, index) in 3"
        :key="index"
        :modules="[Autoplay]"
        :slides-per-view="slidesPerView"
        :loop="true"
        :dir="index === 1 ? 'rtl' : 'ltr'"
        :autoplay="autoplay"
        :speed="5000"
        class="mb-2 sm:mb-8"
      >
        <SwiperSlide
          v-for="(module, i) in index === 0 ? modulesList.slice(0, 7) : index === 1 ? modulesList.slice(7, 14) : modulesList.slice(14)"
          :key="i"
          class="flex items-center justify-center w-[64px] sm:w-[92px] relative my-1"
          :style="{ height: '92px' }"
        >
          <NuxtLink
            class="relative flex items-center justify-center u-bg-gray-50 h-[64px] w-[64px] sm:h-[92px] sm:w-[92px] rounded-md"
            :to="`/modules/${module.name}`"
          >
            <div class="gradient-border" />
            <ModulesListItemCover :icon="module.icon" :alt="module.name" icon-class="w-auto h-8 sm:h-12" />
          </NuxtLink>
        </SwiperSlide>
      </Swiper>
    <div class="w-full flex justify-center items-center pt-8">
      <UButton
        to="/modules"
        variant="primary-gradient"
        size="lg"
        :label="buttonText"
        truncate
      />
    </div>
    <div
      class="absolute top-24 left-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] bg-gradient-to-r from-white via-white dark:from-black dark:via-black to-transparent z-[1]"
    />
    <div
      class="absolute top-24 right-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] bg-gradient-to-l from-white via-white dark:from-black dark:via-black to-transparent z-[1]"
    />
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
  },
  buttonText: {
    type: String,
    default: 'Explore Nuxt Modules'
  }
})

const { modules } = useModules()

const modulesName = [
  'tailwindcss',
  'i18n',
  'content',
  'pinia',
  'image',
  'vueuse',
  'color-mode',
  'prismic',
  'windicss',
  'strapi',
  'formkit',
  'storyblok',
  'sanity',
  'icon',
  'supabase',
  'algolia',
  'directus',
  'unlighthouse',
  'meilisearch',
  'harlem',
  'fontaine'
]

const modulesList = computed(() => {
  return modules.value.filter(module => modulesName.includes(module.name))
})

const { smaller } = useBreakpoints(breakpointsTailwind)

const xs = smaller('sm')
const sm = smaller('md')
const md = smaller('lg')
const lg = smaller('xl')

const slidesPerView = computed(() => {
  if (xs.value) {
    return 4
  } else if (md.value || sm.value) {
    return 5
  } else if (lg.value) {
    return 6
  } else {
    return 7
  }
})
const autoplay = { delay: 0, pauseOnMouseEnter: true, disableOnInteraction: false }
</script>

<style scoped lang="postcss">
.swiper-wrapper {
  transition-timing-function: linear !important;
}

.gradient-border {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 8px;
  z-index: -1;
  transform: translate(-1px, -1px);
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

.swiper-slide:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 5s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
}

@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 360deg;
}

@keyframes gradient-rotate {
  0% {
    --gradient-angle: 360deg;
  }

  100% {
    --gradient-angle: 0deg;
  }
}
</style>
