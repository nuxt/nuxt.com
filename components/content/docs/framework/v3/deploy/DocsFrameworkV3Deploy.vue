<template>
  <div ref="root" class="grid grid-cols-12">
    <ul class="flex flex-col col-span-5 rounded-md">
      <li
        v-for="(data, index) in deployData.deploy"
        ref="sections"
        :key="data.title"
        class="relative flex flex-row p-4 transition duration-200 rounded-md cursor-pointer gap-x-2 group hover:u-bg-gray-50"
        @mouseenter="currentSection = index"
        @mouseleave="currentSection = null"
        @click="currentSection = index"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="{ 'opacity-0': index === currentSection }"
        >
          <img
            :src="`/assets/docs/v3/deploy/${data.icon}`"
            :alt="`${data.icon} icon`"
            class="transition duration-200 group-hover:opacity-0"
            :class="{ 'opacity-0': index === currentSection }"
          >
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="index === currentSection ? 'opacity-100' : 'opacity-0'"
        >
          <img
            :src="`/assets/docs/v3/deploy/${data.iconColor}`"
            :alt="`${data.iconColor} icon`"
            class="transition duration-200 opacity-0 group-hover:opacity-100"
            :class="index === currentSection ? 'opacity-100' : 'opacity-0'"
          >
        </div>
        <div class="flex flex-col pl-16 gap-y-2">
          <h6 class="text-lg font-semibold u-text-gray-900">
            {{ data.title }}
          </h6>
          <p class="u-text-gray-700">
            {{ data.description }}
          </p>
        </div>
      </li>
    </ul>
    <div class="flex items-end justify-center col-span-7">
      <DocsFrameworkV3DeployContainer :current-section="currentSection" />
    </div>
  </div>
</template>

<script setup lang="ts">

const { data: deployData } = await useAsyncData('deply', () => queryContent('/docs/3.x/_collections/deploy').findOne())

const currentSection = ref(null)
</script>
