<template>
  <div class="relative">
    <img v-if="image" :src="`/assets/company/partners/${image}.svg`" :alt="`gem image`" :class="imageClass" class="absolute">
    <div class="relative h-full max-w-[513px] backdrop-blur-md bg-gray-100 bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-30 p-8 rounded-lg shadow-xl z-[1]">
      <img src="/assets/company/partners/quote.svg" alt="quote image" class="absolute top-0 left-0 top-4 left-4">
      <div class="relative flex flex-col gap-y-5">
        <div class="sm:text-lg">
          <ContentSlot :use="$slots.quote" unwrap="p" />
        </div>
        <div class="flex items-center justify-start gap-x-[35px]">
          <img :src="`/assets/company/partners/${authorPicture}.png`" class="w-24 h-24">
          <div>
            <div class="font-semibold sm:text-xl">
              <ContentSlot :use="$slots.authorName" unwrap="p" />
            </div>
            <p class="text-sm font-medium sm:text-base u-text-gray-500">
              <ContentSlot :use="$slots.authorJob" unwrap="p" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  authorPicture: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  }
})
</script>
