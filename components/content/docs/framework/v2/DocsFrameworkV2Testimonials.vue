<template>
  <div class="relative">
    <ul class="grid grid-cols-1 gap-8 overflow-hidden list-none sm:grid-cols-2 lg:grid-cols-3" :class="show ? 'h-full' : 'max-h-[20rem]'">
      <li v-for="testimonial in testimonialsData.testimonials" :key="testimonial.author">
        <DocsFrameworkV2TestimonialCard :testimonial="testimonial" />
      </li>
    </ul>

    <div v-if="!show" class="absolute inset-x-0 bottom-0 flex justify-center pb-8 pointer-events-none bg-gradient-to-t from-white pt-52 dark:from-black" />

    <div class="flex justify-center w-full" :class="show ? 'pt-12' : 'pt-8'">
      <UButton variant="secondary" size="lg" class="relative u-border-gray-900" @click="show = !show">
        <span class="px-4 py-1">
          {{ show ? hideText : showText }}
        </span>
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  showText: {
    type: String,
    default: 'See more'
  },
  hideText: {
    type: String,
    default: 'Hide'
  }
})

const show = ref(false)

const { data: testimonialsData } = await useAsyncData('testimonials', () => queryContent('/docs/framework/v2/_collections/testimonials').findOne())
</script>
