<template>
  <div class="relative h-full max-w-[513px] backdrop-blur-sm u-bg-gray-50 p-8 rounded-lg shadow-xl">
    <img src="/assets/company/partners/quote.svg" alt="quote image" class="absolute top-0 left-0 top-4 left-4">
    <div class="relative flex flex-col gap-y-5">
      <div class="text-lg">
        <Markdown :use="$slots.quote" unwrap="p" />
      </div>
      <div class="flex items-center justify-start gap-x-[35px]">
        <img :src="`/assets/company/partners/${authorPicture}.png`" class="w-24 h-24">
        <div>
          <div class="text-xl font-semibold">
            <Markdown :use="$slots.authorName" unwrap="p" />
          </div>
          <p class="font-medium u-text-gray-500">
            <Markdown :use="$slots.authorJob" unwrap="p" />
          </p>
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
  }
})
</script>
