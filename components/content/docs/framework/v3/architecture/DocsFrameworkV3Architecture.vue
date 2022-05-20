<template>
  <div ref="root" class="grid grid-cols-12">
    <ul class="flex flex-col col-span-5 rounded-md">
      <li
        v-for="(data, index) in architectureData.architecture"
        ref="sections"
        :key="data.title"
        class="relative flex flex-row p-4 transition duration-200 rounded-md gap-x-2 group hover:u-bg-gray-50"
        :class="[currentSection === index ? 'u-bg-gray-50' : 'bg-none', uniqueAnimationRunning && currentSection !== index ? 'opacity-60' : 'opacity-100']"
        @click="startUniqueCounter(animationsDelay, index, index)"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="{ 'opacity-0': currentSection === index }"
        >
          <img :src="`/assets/docs/framework/v3/architecture/${data.icon}`" class="transition duration-200 group-hover:opacity-0" :class="{ 'opacity-0': currentSection === index }">
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="currentSection === index ? 'opacity-100' : 'opacity-0'"
        >
          <img :src="`/assets/docs/framework/v3/architecture/${data.iconColor}`" class="transition duration-200 opacity-0 group-hover:opacity-100" :class="currentSection === index ? 'opacity-100' : 'opacity-0'">
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
    <div class="relative flex items-end justify-center col-span-7">
      <DocsFrameworkV3ArchitectureContainer class="w-full h-full" :class="currentSection === 3 ? 'transition-colors duration-500 delay-100 text-green-400': 'u-text-gray-100'" :opacity="currentSection === 3 ? 1 : 0.3" />
      <DocsFrameworkV3ArchitectureLayout :step="currentSection" :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'" />
      <DocsFrameworkV3ArchitectureArticles :step="currentSection" />
      <DocsFrameworkV3ArchitectureMainArticle :step="currentSection" />
      <DocsFrameworkV3ArchitectureContent :step="currentSection" />
      <DocsFrameworkV3ArchitectureHeader :step="currentSection" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const { data: architectureData } = await useAsyncData('architecture', () => queryContent('/docs/framework/v3/_collections/architecture').findOne())

const { currentSection, stopCounter, restartCounter } = useCounterAnimations()

const root = ref(null) as Ref<Element>
const observer = ref() as Ref<IntersectionObserver>
const sections = ref(null)
const animationsDelay = [2500, 2500, 2500, 2500]

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      restartCounter(animationsDelay, currentSection.value)
    } else {
      stopCounter()
    }
  })

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>
