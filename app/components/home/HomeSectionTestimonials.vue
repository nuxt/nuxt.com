<script setup lang="ts">
defineProps<{
  testimonials: {
    quote: string
    author: {
      name: string
      description: string
      to: string
      target?: string
      avatar: {
        src: string
        srcset?: string
      }
    }
  }[]
}>()
</script>

<template>
  <UPageColumns>
    <div v-for="(testimonial, index) in testimonials" :key="index" class="break-inside-avoid">
      <ULandingTestimonial v-bind="testimonial" />
    </div>
  </UPageColumns>
</template>
