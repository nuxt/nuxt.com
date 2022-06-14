<template>
  <UContainer padded class="pb-16 sm:pb-32">
    <ul role="list" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 md:gap-x-12 md:gap-y-10">
      <li v-for="data in caseStudiesData" :key="data._path" class="relative">
        <UCard padded shadow-class="" class="relative transition duration-200 aspect-w-16 aspect-h-7 group hover:ring-2 hover:u-ring-gray-900" body-class="">
          <img :src="data.imgUrl" :alt="data._path" class="object-contain object-center w-full h-full transition-all duration-300 bg-white pointer-events-none group-hover:scale-110">
          <NuxtLink :to="data._path" tabindex="-1" class="focus:outline-none">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>
        </UCard>
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: caseStudiesData } = await useAsyncData('resources-case-studies', () => queryContent().where({
  _path: /^\/resources\/case-studies\//
}).find())
</script>
