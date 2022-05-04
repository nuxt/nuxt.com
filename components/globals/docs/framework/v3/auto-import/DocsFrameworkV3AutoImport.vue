<template>
  <div class="grid grid-cols-12 pt-12">
    <ul class="flex flex-col col-span-3 gap-y-6">
      <li v-for="(data, index) in autoImportData.autoImport" :key="data.title" class="flex gap-x-4 items-center">
        <div class="relative">
          <img src="/docs/framework/v3/auto-import/hexagon.svg" class="h-14 w-16" alt="hexagon container">
          <div class="h-14 w-16 absolute top-0 flex justify-center items-center">
            <img
              :src="`/docs/framework/v3/auto-import/${data.icon}`"
              class="h-8 w-8 transition-opacity duration-0 absolute"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/docs/framework/v3/auto-import/${data.iconColor}`"
              class="h-8 w-8 transition-opacity duration-0 absolute"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-100' : 'opacity-0'"
            >
          </div>
        </div>
        <h6 class="text-lg transition-colors duration-0" :class="currentSection === index ? 'text-green-400' : 'u-text-gray-500'">
          {{ data.title }}
        </h6>
      </li>
    </ul>
    <div class="col-span-9 flex w-full h-full items-center justify-center relative">
      <DocsFrameworkV3AutoImportContainer />
      <DocsFrameworkV3AutoImportTerminal />
    </div>
  </div>
</template>
<script setup lang="ts">
const { currentSection, startCounter2 } = useCounterAnimations()

onMounted(() => {
  startCounter2([4200, 4200, 2000])
})

const { data: autoImportData } = await useAsyncData('autoImport', () => queryContent('/docs/framework/v3/collections/auto-import').findOne())
</script>
