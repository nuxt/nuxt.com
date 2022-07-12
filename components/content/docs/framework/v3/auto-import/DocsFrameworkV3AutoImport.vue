<template>
  <div ref="root" class="grid grid-cols-12 pt-12">
    <ul class="flex flex-col col-span-3 gap-y-6">
      <li
        v-for="(data, index) in autoImportData.autoImport"
        :key="data.title"
        class="flex items-center opacity-100 cursor-pointer gap-x-4"
        @mouseenter="hoveredSection(index)"
        @mouseleave="currentSection = null"
        @click="hoveredSection(index)"
      >
        <div class="relative">
          <Hexagon class="w-16 u-text-gray-50 h-14" />
          <div class="absolute top-0 flex items-center justify-center w-16 h-14 z-1">
            <img
              :src="`/assets/docs/v3/auto-import/${data.icon}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="currentSection.value === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/assets/docs/v3/auto-import/${data.iconColor}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="currentSection.value === index ? 'opacity-100' : 'opacity-0'"
            >
          </div>
        </div>
        <h6
          class="text-lg transition-colors duration-0"
          :class="currentSection.value === index ? 'text-green-400' : 'u-text-gray-500'"
        >
          {{ data.title }}
        </h6>
      </li>
    </ul>
    <div class="relative flex items-center justify-center w-full h-full col-span-9">
      <!-- DocsFrameworkV3AutoImportContainer :current-section="currentSection" :section1-steps="section1Steps" :section2-steps="section2Steps" :section3-steps="section3Steps" /-->
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: autoImportData } = await useAsyncData('autoImport', () => queryContent('/docs/3.x/_collections/auto-import').findOne())

const currentSection = ref()

const hoveredSection = (index) => {
  console.log(index)
  // currentSection.value = index
}

</script>
