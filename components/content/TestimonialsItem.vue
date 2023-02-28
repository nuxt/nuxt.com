<template>
  <Component :is="is">
    <div class="relative flex flex-col md:justify-between" :class="paddingClass">
      <div v-if="backgroundImage" :class="backgroundImageClass">
        <img
          :src="`${backgroundImage.path}-dark.${backgroundImage.format}`"
          alt=""
          class="h-full hidden dark:block"
          :width="backgroundImage.width"
          :height="backgroundImage.height"
          loading="lazy"
        >
        <img
          :src="`${backgroundImage.path}-light.${backgroundImage.format}`"
          alt=""
          class="h-full dark:hidden"
          :width="backgroundImage.width"
          :height="backgroundImage.height"
          loading="lazy"
        >
      </div>
      <q class="pb-6 u-text-gray-600">
        <ContentSlot :use="$slots.quote" unwrap="p" />
      </q>
      <div>
        <a :href="authorUrl" rel="author" target="_blank" class="flex flex-row items-center">
          <img
            :src="`/assets/${authorImg}.png`"
            class="h-12"
            :alt="`${authorImg} picture`"
            width="49"
            height="48"
            loading="lazy"
          >
          <div class="flex flex-col pl-8">
            <span class="font-semibold u-text-gray-900">
              <ContentSlot :use="$slots.author" unwrap="p" />
            </span>
            <span class="text-sm u-text-gray-400">
              <ContentSlot :use="$slots.job" unwrap="p" />
            </span>
          </div>
        </a>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">

import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  authorImg: {
    type: String,
    default: ''
  },
  authorUrl: {
    type: String,
    default: ''
  },
  is: {
    type: String,
    default: 'li'
  },
  paddingClass: {
    type: String,
    default: 'pt-4'
  },
  backgroundImageClass: {
    type: String,
    default: 'absolute -left-4 -top-4 -z-50'
  },
  backgroundImage: {
    type: Object as PropType<Image>,
    default: () => ({})
  }
})
</script>
