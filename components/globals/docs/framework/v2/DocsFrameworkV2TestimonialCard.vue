<template>
  <a :href="testimonial.authorUrl" rel="author">
    <div class="relative">
      <img src="/docs/framework/v2/quote.svg" class="absolute top-0 h-8 w-8 -left-0 opacity-70">
      <div class="pl-8 pt-4">
        <p class="text-sm u-text-gray-500 pb-6">
          {{ testimonial.testimonial }}
        </p>
        <div class="flex flex-row items-center">
          <img :src="`/docs/framework/v2/${testimonial.authorIcon}.png`" class="h-12">
          <div class="pl-8 flex flex-col">
            <span class="font-semibold u-text-gray-900">{{ testimonial.author }}</span>
            <span class="text-sm u-text-gray-400">{{ testimonial.job }}</span>
          </div>
        </div>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
defineProps({
  testimonial: {
    type: Object,
    default: () => {}
  }
})
</script>
