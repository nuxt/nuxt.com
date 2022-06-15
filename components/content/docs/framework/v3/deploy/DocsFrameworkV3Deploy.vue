<template>
  <div ref="root" class="grid grid-cols-12">
    <ul class="flex flex-col col-span-5 rounded-md">
      <li
        v-for="(data, index) in deployData.deploy"
        ref="sections"
        :key="data.title"
        class="relative flex flex-row p-4 transition duration-200 rounded-md cursor-pointer gap-x-2 group hover:u-bg-gray-50"
        :class="[{ 'opacity-50 cursor-auto': sectionAnimating && (
          (!section1Steps.includes(currentSection) && index === 0) ||
          (!section2Steps.includes(currentSection) && index === 1) ||
          (!section3Steps.includes(currentSection) && index === 2)
        )}, { 'u-bg-gray-100': isCurrentSection(index) }]"
        @click="!sectionAnimating ? restartAnimation(index) : () => {}"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="{ 'opacity-0': isCurrentSection(index) }"
        >
          <img
            :src="`/assets/docs/framework/v3/deploy/${colorMode.preference === 'dark' ? data.iconDark : data.icon}`"
            class="transition duration-200 group-hover:opacity-0"
            :class="{ 'opacity-0': isCurrentSection(index) }"
          >
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="isCurrentSection(index) ? 'opacity-100' : 'opacity-0'"
        >
          <img
            :src="`/assets/docs/framework/v3/deploy/${data.iconColor}`"
            class="transition duration-200 opacity-0 group-hover:opacity-100"
            :class="isCurrentSection(index) ? 'opacity-100' : 'opacity-0'"
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
      <div class="translate-x-36 bg-gray-900 dark:bg-gray-800 rounded-md h-[426px] w-[626px]">
        <DocsFrameworkV3DeployServer v-if="section1Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployStatic v-if="section2Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployHybrid v-if="section3Steps.includes(currentSection)" />
        <DocsFrameworkV3DeployDots :current-section="currentSection" :restart-animation="sectionAnimating" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const { data: deployData } = await useAsyncData('deply', () => queryContent('/docs/framework/3.x/_collections/deploy').findOne())

const { currentSection, restartCounter, stopCounter } = useCounterAnimations()
const colorMode = useColorMode()

const root = ref(null) as Ref<Element>
const observer = ref() as Ref<IntersectionObserver>
const sections = ref(null)
const sectionAnimating = ref(false)
const animationsDelay = [500, 1000, 1000, 500, 2000, 800, 1500, 3500, 800, 500, 500, 1000, 1000, 1000, 1000, 800]
const section1Steps = [0, 1, 2, 3, 4, 5]
const section2Steps = [6, 7, 8]
const section3Steps = [9, 10, 11, 12, 13, 14, 15]

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      restartCounter(animationsDelay, currentSection.value)
    } else {
      stopCounter()
    }
  })

const restartAnimation = (section: number) => {
  sectionAnimating.value = true

  setTimeout(() => {
    sectionAnimating.value = false
  }, 6700)

  restartCounter(animationsDelay, section === 1 ? 6 : section === 2 ? 9 : 0)
}

const isCurrentSection = (index) => {
  return (section1Steps.includes(currentSection.value) && index === 0) ||
    (section2Steps.includes(currentSection.value) && index === 1) ||
    (section3Steps.includes(currentSection.value) && index === 2)
}

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>
