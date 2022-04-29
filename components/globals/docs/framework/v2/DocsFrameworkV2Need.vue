<template>
  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12">
    <li v-for="need in needData[0].needs" :key="need.title">
      <NuxtLink :to="`/docs/framework/v2${need.to}`">
        <UCard shadow-class="shadow-none hover:shadow-md hover:drop-shadow-md hover:shadow-inner-md transition-shadow duration-300" class="group p-2">
          <div class="flex justify-between pb-4">
            <div class="h-8 w-8 relative">
              <img :src="`/docs/framework/v2/${need.icon}`" class="h-full w-full opacity-100 group-hover:opacity-0 transition-opacity duration-300 absolute top-0">
              <img :src="`/docs/framework/v2/${need.iconColor}`" class="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0">
            </div>
            <UIcon name="heroicons-solid:arrow-right" alt="arrow" class="mr-4 opacity-0 group-hover:translate-x-4 group-hover:opacity-100 h-6 w-6 transition duration-300" />
          </div>
          <h5 class="font-semibold text-2xl pb-4">
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
