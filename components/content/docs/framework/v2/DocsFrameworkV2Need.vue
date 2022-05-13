<template>
  <ul class="grid grid-cols-1 gap-12 pt-12 sm:grid-cols-2">
    <li v-for="need in needData[0].needs" :key="need.title">
      <NuxtLink :to="`/docs/framework/v2${need.to}`">
        <UCard shadow-class="transition-shadow duration-300 shadow-none hover:shadow-md hover:drop-shadow-md hover:shadow-inner-md" class="p-2 group">
          <div class="flex justify-between pb-4">
            <div class="relative w-8 h-8">
              <img :src="`/docs/framework/v2/${need.icon}`" class="absolute top-0 w-full h-full transition-opacity duration-300 opacity-100 group-hover:opacity-0" :alt="`${need.title} illustration`">
              <img :src="`/docs/framework/v2/${need.iconColor}`" class="absolute top-0 w-full h-full transition-opacity duration-300 opacity-0 group-hover:opacity-100" :alt="`${need.title} green illustration`">
            </div>
            <UIcon name="heroicons-solid:arrow-right" alt="arrow" class="w-6 h-6 mr-4 transition duration-300 opacity-0 group-hover:translate-x-4 group-hover:opacity-100" />
          </div>
          <h5 class="pb-4 text-2xl font-semibold">
            {{ need.title }}
          </h5>
          <p class="u-text-gray-500">
            {{ need.description }}
          </p>
        </UCard>
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
const { data: needData } = await useAsyncData('need', () => queryContent('/docs/framework/v2/collections/need').find())
</script>
