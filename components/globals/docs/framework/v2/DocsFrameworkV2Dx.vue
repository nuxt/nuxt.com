<template>
  <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pt-12">
    <li v-for="dx in dxData[0].developerExperiences" :key="dx.title" class="flex flex-col gap-y-4 items-center">
      <div class="relative">
        <img src="/docs/framework/v2/hexagon.svg">
        <div class="w-full h-full absolute top-0 flex justify-center items-center">
          <img :src="`${dx.icon}`" class="w-8 h-8">
        </div>
      </div>
      <h6 class="font-semibold u-text-gray-900 text-lg text-center">
        {{ dx.title }}
      </h6>
      <p class="u-text-gray-400 text-center">
        {{ dx.description }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">

const { data: dxData } = await useAsyncData('dx', () => queryContent('/docs/framework/v2/collections/dx').find())

</script>
