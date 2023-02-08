<template>
  <ul :class="cardListClass">
    <div v-if="backgroundImage" :class="backgroundImageClass">
      <img
        :src="`${backgroundImage.path}-light.${backgroundImage.format}`"
        :width="backgroundImage.width"
        :height="backgroundImage.height"
        alt=""
        class="dark:hidden opacity-0 md:opacity-100 -z-10"
      >
      <img
        :src="`${backgroundImage.path}-dark.${backgroundImage.format}`"
        :width="backgroundImage.width"
        :height="backgroundImage.height"
        alt=""
        class="hidden dark:block opacity-0 md:opacity-100"
      >
    </div>
    <ContentSlot :use="$slots.default" unwrap="p" />
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  cardListClass: {
    type: String,
    default: 'grid grid-cols-1 gap-8 pt-16 sm:grid-cols-2 lg:grid-cols-3'
  },
  backgroundImage: {
    type: Object as PropType<Image>,
    default: () => ({})
  },
  backgroundImageClass: {
    type: String,
    default: 'absolute right-0 inset-y-0 flex'
  }
})
</script>
