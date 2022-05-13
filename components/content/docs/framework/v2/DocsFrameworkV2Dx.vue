<template>
  <ul class="grid grid-cols-1 gap-8 pt-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    <li v-for="dx in dxData[0].developerExperiences" :key="dx.title" class="flex flex-col items-center gap-y-4">
      <div class="relative">
        <img src="/docs/framework/v2/hexagon.svg" alt="hexagon background">
        <div class="absolute top-0 flex items-center justify-center w-full h-full">
          <img :src="`${dx.icon}`" class="w-8 h-8" :alt="`${dx.title} icon`">
        </div>
      </div>
      <h6 class="text-lg font-semibold text-center u-text-gray-900">
        {{ dx.title }}
      </h6>
      <p class="text-center u-text-gray-400">
        {{ dx.description }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
const { data: dxData } = await useAsyncData('dx', () => queryContent('/docs/framework/v2/collections/dx').find())
</script>
