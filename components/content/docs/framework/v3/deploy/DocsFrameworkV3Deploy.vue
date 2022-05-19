<template>
  <div class="grid grid-cols-12 ">
    <ul class="flex flex-col col-span-5 rounded-md">
      <li
        v-for="(data, index) in deployData.deploy"
        ref="sections"
        :key="data.title"
        class="relative flex flex-row p-4 transition duration-200 rounded-md gap-x-2 group hover:u-bg-gray-50"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="{ 'opacity-0': currentSection === index }"
        >
          <img :src="`/docs/framework/v3/deploy/${data.icon}`" class="transition duration-200 group-hover:opacity-0" :class="{ 'opacity-0': currentSection === index }">
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="currentSection === index ? 'opacity-100' : 'opacity-0'"
        >
          <img :src="`/docs/framework/v3/deploy/${data.iconColor}`" class="transition duration-200 opacity-0 group-hover:opacity-100" :class="currentSection === index ? 'opacity-100' : 'opacity-0'">
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
      <div class="translate-x-36 bg-gray-900 rounded-md h-[426px] w-[626px]">
        <DocsFrameworkV3DeployServer v-if="section1Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployStatic v-if="section2Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployHybrid v-if="section3Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployDots :current-section="currentSection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sections = ref(null)
const { currentSection, startCounter } = useCounterAnimations()
const animationsDelay = [500, 1000, 1000, 500, 2000, 800, 1500, 3500, 800, 500, 500, 1000, 1000, 1000, 1000, 800]
const section1Steps = [500, 1000, 1000, 500, 2000, 800] // 5800 + 900 timeout dots = 6700
const section2Steps = [1500, 3500, 800] // 5800 + 900 timeout dots = 6700
const section3Steps = [500, 500, 1000, 1000, 1000, 1000, 800] // 5800 + 900 timeout dots = 6700

onMounted(() => {
  startCounter(animationsDelay)
})

const { data: deployData } = await useAsyncData('deply', () => queryContent('/docs/framework/v3/_collections/deploy').findOne())
</script>
