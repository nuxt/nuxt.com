<template>
  <ul ref="root" class="grid grid-cols-1 gap-y-8 sm:gap-x-4 md:gap-x-8 lg:gap-x-16 sm:grid-cols-2">
    <li
      v-for="data in commandsData.commands"
      :key="data.title"
      class="relative flex flex-col p-4 rounded-md md:flex-row gap-x-2"
    >
      <div
        class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 rounded-md u-bg-gray-100"
      >
        <img
          :src="`/assets/docs/v3/commands/${data.icon}`"
          :alt="data.icon"
        >
      </div>
      <div class="flex flex-col pt-16 md:pt-0 md:pl-16 gap-y-2">
        <h6 class="text-lg font-semibold u-text-gray-900">
          {{ data.title }}
        </h6>
        <p class="u-text-gray-700">
          {{ data.description }}
        </p>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">

const { data: commandsData } = await useAsyncData('commands', () => queryContent('/docs/3.x/_collections/commands').findOne())

</script>
