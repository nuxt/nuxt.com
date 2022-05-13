<template>
  <UContainer padded>
    <ul role="list" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 md:gap-x-12 md:gap-y-10">
      <li v-for="data in caseStudiesData" :key="data.path" class="relative">
        <div class="block w-full overflow-hidden rounded-lg ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group aspect-w-16 aspect-h-7 u-bg-gray-100">
          <img :src="data.imgUrl" :alt="data.path" class="object-contain object-center transition-all duration-300 bg-white pointer-events-none group-hover:scale-110">
          <NuxtLink :to="data.path" tabindex="-1" class="focus:outline-none">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>
        </div>
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: caseStudiesData } = await useAsyncData('resources-case-studies', () => queryContent('/resources/case-studies').where({ $not: { path: { $in: ['/resources/case-studies'] } } }).find())
</script>
