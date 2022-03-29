<template>
  <div>
    <div class="py-10 sm:py-20 relative overflow-hidden">
      <img :src="page.gradientUrl" alt="" class="z-0 absolute inset-x-0 bottom-0 translate-y-1/4 w-full">

      <UContainer padded constrained-class="max-w-4xl" class="z-[1] relative">
        <h1 class="text-4xl tracking-tight font-bold u-text-gray-900 sm:text-5xl">
          {{ page.title }}
        </h1>
        <p class="mt-3 text-base u-text-gray-600 sm:text-lg md:mt-5">
          {{ page.description }}
        </p>
        <NuxtLink :to="page.url" target="_blank" class="inline-flex items-center mt-3 md:mt-5 font-bold hover:underline">
          See website
          <UIcon name="heroicons-outline:arrow-sm-right" class="w-4 h-4 ml-1" />
        </NuxtLink>
      </UContainer>
    </div>

    <Content v-if="page" :id="page.id" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { findOne } = useContentQuery(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)

const { data: page } = await useAsyncData('docs-page-content', findOne)
</script>
