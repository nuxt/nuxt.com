<template>
  <div class="grid grid-cols-12 pt-12">
    <ul class="flex flex-col col-span-3 gap-y-6">
      <li
        v-for="(data, index) in autoImportData.autoImport"
        :key="data.title"
        class="flex items-center gap-x-4"
        :class="uniqueAnimationRunning && currentSection !== index ? 'opacity-60' : 'opacity-100'"
        @click="!uniqueAnimationRunning ? startUniqueCounter(animationsDelay, index, index) : () => {}"
      >
        <div class="relative">
          <img src="/docs/framework/v3/auto-import/hexagon.svg" class="w-16 h-14" alt="hexagon container">
          <div class="absolute top-0 flex items-center justify-center w-16 h-14">
            <img
              :src="`/docs/framework/v3/auto-import/${data.icon}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/docs/framework/v3/auto-import/${data.iconColor}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
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
    <div class="relative flex items-center justify-center w-full h-full col-span-9">
      <DocsFrameworkV3AutoImportContainer :step="currentSection" :unique-animation="counterStopped" />
      <DocsFrameworkV3AutoImportTerminal :current-section="currentSection" :unique-animation="counterStopped" />
    </div>
  </div>
</template>
<script setup lang="ts">
const { currentSection, startCounter, startUniqueCounter, counterStopped, uniqueAnimationRunning } = useCounterAnimations()
const animationsDelay = [10500, 10500, 4000]

onMounted(() => {
  startCounter(animationsDelay)
})

const { data: autoImportData } = await useAsyncData('autoImport', () => queryContent('/docs/framework/v3/_collections/auto-import').findOne())
</script>
