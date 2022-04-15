<template>
  <UContainer padded>
    <ul role="list" class="grid sm:grid-cols-2 gap-4 lg:grid-cols-3 sm:gap-6 md:gap-x-12 md:gap-y-10">
      <li v-for="data in caseStudiesData" :key="data.slug" class="relative">
        <div class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group block w-full aspect-w-16 aspect-h-7 rounded-lg u-bg-gray-100 overflow-hidden">
          <img :src="data.imgUrl" alt="" class="group-hover:scale-110 duration-300 transition-all object-contain object-center pointer-events-none bg-white">
          <NuxtLink :to="data.slug" tabindex="-1" class="focus:outline-none">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>
        </div>
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">

const { data: caseStudiesData } = await useAsyncData('resources-case-studies', () =>
  queryContent('/resources/case-studies').where({ $not: { slug: { $in: ['/resources/case-studies'] } } }).find())
</script>
