<template>
  <ul class="grid grid-cols-1 gap-1 sm:gap-8 sm:grid-cols-2 border-gray-200 dark:border-gray-800 rounded-xl" :class="gridClass">
    <div v-if="backgroundImg" class="absolute right-0 inset-y-0 flex">
      <img
        :src="`${backgroundImg.path}-dark.png`"
        :width="backgroundImg.width"
        :height="backgroundImg.height"
        alt=""
        class="dark:hidden opacity-0 md:opacity-100"
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
defineProps({
  gridClass: {
    type: String,
    default: 'lg:grid-cols-3'
  },
  backgroundImg: {
    type: Object,
    default: () => {}
  }
})
</script>
