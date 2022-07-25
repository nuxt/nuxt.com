<template>
  <div v-if="page" class="pb-16 sm:pb-32">
    <div class="relative py-10 overflow-hidden sm:py-20">
      <img :src="page.gradientUrl" alt="" class="absolute inset-x-0 bottom-0 z-0 w-full translate-y-1/4">

      <UContainer padded constrained-class="max-w-4xl" class="z-[1] relative text-center flex flex-col items-center">
        <h1 class="text-4xl font-semibold tracking-tight u-text-gray-900 sm:text-5xl">
          {{ page.title }}
        </h1>
        <p class="mt-3 text-base u-text-gray-600 sm:text-lg md:mt-5">
          {{ page.description }}
        </p>
        <GradientNuxtLink icon="uil:arrow-right" :to="page.url" target="_blank" class="mt-3 text-lg font-semibold md:mt-5">
          See website
        </GradientNuxtLink>
      </UContainer>
    </div>

    <ContentRenderer :value="page" />

    <UContainer padded constrained-class="max-w-4xl">
      <ResourcesCaseStudiesPostCta />

      <ResourcesCaseStudiesPostPrevNext :prev="prev" :next="next" />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  page: {
    type: Object,
    default: null
  },
  prev: {
    type: Object,
    default: null
  },
  next: {
    type: Object,
    default: null
  }
})
</script>
