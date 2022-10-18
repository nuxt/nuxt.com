<template>
  <div ref="root" class="relative flex flex-col justify-center gap-y-20 xl:flex-row xl:justify-between">
    <ul class="grid grid-cols-1 rounded-md xl:flex xl:flex-col xl:w-2/5 gap-y-2">
      <li
        v-for="(data, index) in autoImportData.autoImport"
        :key="data.title"
        class="relative flex flex-col p-4 transition duration-200 rounded-md cursor-pointer md:flex-row gap-x-2 group hover:u-bg-gray-50"
        @mouseenter="currentSection = index"
        @mouseleave="currentSection = null"
        @click="currentSection = index"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
        >
          <img
            :src="`/assets/docs/v3/auto-import/${data.icon}`"
            :alt="`${data.icon} icon`"
            class="transition duration-200 group-hover:opacity-0"
            :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
          >
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="currentSection === index ? 'opacity-100' : 'opacity-0'"
        >
          <img
            :src="`/assets/docs/v3/auto-import/${data.iconColor}`"
            :alt="`${data.iconColor} icon`"
            class="transition duration-200 opacity-0 group-hover:opacity-100"
            :class="currentSection === index ? 'opacity-100' : 'opacity-0'"
          >
        </div>
        <div class="flex flex-col pt-16 md:pt-0 md:pl-16 gap-y-2">
          <h3 class="text-lg font-semibold u-text-gray-900">
            {{ data.title }}
          </h3>
          <p class="u-text-gray-700">
            {{ data.description }}
          </p>
        </div>
      </li>
    </ul>
    <div class="top-0 right-0 flex items-center justify-center flex-1 xl:absolute 2xl:-right-32 top-10">
      <div class="xl:ml-20">
        <DocsFrameworkV3AutoImportContainer :current-section="currentSection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: autoImportData } = await useAsyncData('autoImport', () => queryContent('/docs/_collections/auto-import').findOne())

const currentSection = ref(null)
</script>
