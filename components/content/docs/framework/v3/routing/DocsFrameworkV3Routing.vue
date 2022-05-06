<template>
  <div class="grid grid-rows-12 pt-12 gap-y-12">
    <ul class="flex row-span-3 gap-x-16 items-center">
      <li
        v-for="(data, index) in routingData.routings"
        :key="data.title"
        class="flex flex-col gap-y-2 justify-center items-center"
        :class="uniqueAnimationRunning && currentSection !== index ? 'opacity-60' : 'opacity-100'"
        @click="!uniqueAnimationRunning ? startUniqueCounter(animationsDelay, index, index) : () => {}"
      >
        <div class="relative">
          <img src="/docs/framework/v3/routing/hexagon.svg" alt="hexagon container" class="h-20 w-22">
          <div class="absolute top-0 h-full w-full flex items-center justify-center ">
            <img
              :src="`/docs/framework/v3/routing/${data.icon}`"
              class="h-12 w-12 transition-opacity duration-0 absolute"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/docs/framework/v3/routing/${data.iconColor}`"
              class="h-12 w-12 transition-opacity duration-0 absolute"
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
    <div class="row-span-9 flex w-full h-full items-center justify-center relative">
      <DocsFrameworkV3RoutingContainer class="flex items-start" />
      <!-- DocsFrameworkV3AutoImportTerminal :current-section="currentSection" :unique-animation="counterStopped" /-->
    </div>
  </div>
</template>
<script setup lang="ts">
const { currentSection, startCounter, startUniqueCounter, counterStopped, uniqueAnimationRunning } = useCounterAnimations()
const animationsDelay = [8000, 8000, 8000, 8000]
const uniqueAnimation = ref(false)

onMounted(() => {
  startCounter(animationsDelay)
})

const { data: routingData } = await useAsyncData('file-system-routing', () => queryContent('/docs/framework/v3/collections/routing').findOne())
</script>
