<template>
  <div v-if="page" class="pb-12 sm:pb-28">
    <div class="py-10 sm:py-20 relative overflow-hidden">
      <img :src="page.gradientUrl" alt="" class="z-0 absolute inset-x-0 bottom-0 translate-y-1/4 w-full">

      <UContainer padded constrained-class="max-w-4xl" class="z-[1] relative text-center flex flex-col items-center">
        <h1 class="text-4xl tracking-tight font-bold u-text-gray-900 sm:text-5xl">
          {{ page.title }}
        </h1>
        <p class="mt-3 text-base u-text-gray-600 sm:text-lg md:mt-5">
          {{ page.description }}
        </p>
        <NuxtLink :to="page.url" target="_blank" class="text-lg relative inline-flex items-center font-bold mt-3 md:mt-5 group flex-nowrap max-w-max">
          See website
          <span
            class="rounded absolute u-bg-gray-700 left-0 font-extrabold -bottom-1 h-0.5 w-0 group-hover:w-full transition-all"
          />
          <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5 ml-1 mt-0.5" />
        </NuxtLink>
      </UContainer>
    </div>

    <Document v-model="page" />

    <UContainer constrained-class="max-w-4xl">
      <ResourcesCaseStudyCTA />

      <ResourcesCaseStudyPrevNext :prev="prev" :next="next" />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const { prev, next, page, fetchPage } = useContent()

await fetchPage()
</script>
