<template>
  <ul :class="cardListClass">
    <div v-if="backgroundImg" :class="backgroundImgClass">
      <img
        :src="`${backgroundImg.path}-light.png`"
        :width="backgroundImg.width"
        :height="backgroundImg.height"
        alt=""
        class="dark:hidden opacity-0 md:opacity-100 -z-10"
        role="presentation"
      >
      <img
        :src="`${backgroundImg.path}-dark.png`"
        :width="backgroundImg.width"
        :height="backgroundImg.height"
        alt=""
        class="hidden dark:block opacity-0 md:opacity-100"
        role="presentation"
      >
    </div>
    <ContentSlot :use="$slots.default" unwrap="p" />
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  cardListClass: {
    type: String,
    default: 'grid grid-cols-1 gap-8 pt-16 sm:grid-cols-2 lg:grid-cols-3'
  },
  backgroundImg: {
    type: Object as PropType<
    {
      path: String,
      width: any,
      height: any
    }>,
    default: () => {}
  },
  backgroundImgClass: {
    type: String,
    default: 'absolute right-0 inset-y-0 flex'
  }
})
</script>
