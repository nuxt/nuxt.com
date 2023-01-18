<template>
  <div class="relative mt-20" aria-hidden="true">
    <div class="overflow-hidden">
      <div v-for="(moduleList, index) in modulesList" :key="index" class="slider">
        <div class="slide-track mb-2 sm:mb-8" :class="index === 1 ? 'animation-reverse' : 'animation'">
          <div
            v-for="(module, i) in modulesList[index]"
            :key="i"
            class="slide"
          >
            <NuxtLink
              class="relative flex items-center justify-center bg-white dark:bg-gray-900 h-[86px] w-[86px] rounded-md ring-1 ring-gray-200 hover:ring-0 dark:ring-0 mt-1"
              :to="`/modules/${module.name}`"
              tabindex="-1"
            >
              <ModulesListItemCover :icon="`${module.name}.${module.format}`" :alt="module.name" icon-class="w-auto h-8 sm:h-12" />
              <div class="hidden gradient-border gradient-border-dark dark:block" />
              <div class="dark:hidden gradient-border gradient-border-light" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
    <div
      class="absolute pointer-events-none top-0 left-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[100px] bg-gradient-to-r from-white via-white dark:from-black to-transparent z-[1]"
    />
    <div
      class="absolute pointer-events-none top-0 right-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[100px] bg-gradient-to-l from-white via-white dark:from-black to-transparent z-[1]"
    />
  </div>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const { smaller } = useBreakpoints(breakpointsTailwind)

const xs = smaller('sm')

const slidesPerView = computed(() => {
  if (xs.value) {
    return 4
  } else {
    return 7
  }
})

const modulesList = computed(() => {
  const array1: Array<{ name: string, format: string}> = [
    { name: 'tailwindcss', format: 'png' }, { name: 'i18n', format: 'png' }, { name: 'content', format: 'png' }, { name: 'pinia', format: 'svg' },
    { name: 'image', format: 'png' }, { name: 'vueuse', format: 'svg' }, { name: 'color-mode', format: 'png' }
  ]

  const array2: Array<{ name: string, format: string}> = [
    { name: 'prismic', format: 'png' }, { name: 'windicss', format: 'svg' }, { name: 'strapi', format: 'png' }, { name: 'formkit', format: 'png' },
    { name: 'storyblok', format: 'png' }, { name: 'sanity', format: 'png' }, { name: 'icons', format: 'png' }
  ]

  const array3: Array<{ name: string, format: string}> = [
    { name: 'supabase', format: 'png' }, { name: 'algolia', format: 'svg' }, { name: 'directus', format: 'svg' }, { name: 'unlighthouse', format: 'svg' },
    { name: 'meilisearch', format: 'svg' }, { name: 'harlem', format: 'svg' }, { name: 'fontaine', format: 'png' }
  ]

  return [
    [...array1.concat(array1)],
    [...array2.concat(array2)],
    [...array3.concat(array3)]
  ]
})
</script>

<style scoped lang="postcss">

:root {
  --gradient-angle: 360deg;
}

@keyframes scroll {
  0% {
  -webkit-transform: translateX(0);
  transform: translateX(0);
  }
  100% {
  -webkit-transform: translateX(calc(-200px * v-bind(slidesPerView)));
  transform: translateX(calc(-200px * v-bind(slidesPerView)));
  }
}

.slider {
  height: 100px;
  margin: auto;
  position: relative;
  width: 960px;
}

.slider::after {
  right: 0;
  top: 0;
  -webkit-transform: rotateZ(180deg);
  transform: rotateZ(180deg);
}

.slider::before {
  left: 0;
  top: 0;
}

.animation {
  -webkit-animation: scroll 30s linear infinite;
  animation: scroll 30s linear infinite;
}

.slide-track:hover, .slide-track:hover {
  animation-play-state: paused;

  .slide {
    animation-play-state: running;
  }
}

.animation-reverse {
  -webkit-animation: scroll 30s linear infinite reverse;
  animation: scroll 30s linear infinite reverse;
}

.slider .slide-track {
  display: flex;
  width: calc(200px * (v-bind(slidesPerView) * 2));
}

.slider .slide {
  height: 100px;
  width: 200px;
}

.gradient-border {
  opacity: 0;
  margin-top: 1px;
  margin-left: 1px;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 8px;
  z-index: -1;
  transform: translate(-2px, -2px);
}

.gradient-border-light {
  background: linear-gradient(var(--gradient-angle), rgba(0, 220, 130, 1), white, rgba(54, 228, 218, 0.5), rgba(29, 224, 177, 0.3));
}

.gradient-border-dark {
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

.slide:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 5s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
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
