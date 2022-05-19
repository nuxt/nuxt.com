<template>
  <a :href="testimonial.authorUrl" rel="author">
    <div class="relative">
      <img src="/assets/docs/framework/v2/quote.svg" class="absolute top-0 w-8 h-8 -left-0 opacity-70" alt="Quote image">
      <div class="pt-4 pl-8">
        <p class="pb-6 text-sm u-text-gray-500">
          {{ testimonial.testimonial }}
        </p>
        <div class="flex flex-row items-center">
          <img :src="`/assets/docs/framework/v2/${testimonial.authorIcon}.png`" class="h-12" :alt="`${testimonial.author} picture`">
          <div class="flex flex-col pl-8">
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
