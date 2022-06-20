<template>
  <div ref="root" class="grid grid-cols-12">
    <ul class="flex flex-col col-span-5 rounded-md gap-y-2">
      <li
        v-for="(data, index) in architectureData.architecture"
        :key="data.title"
        class="relative flex flex-row p-4 transition duration-200 rounded-md cursor-pointer gap-x-2 group hover:u-bg-gray-50"
        :class="[{ 'opacity-50 cursor-auto': sectionAnimating && (
          (!section1Steps.includes(currentSection) && index === 0) ||
          (!section2Steps.includes(currentSection) && index === 1) ||
          (!section3Steps.includes(currentSection) && index === 2) ||
          (!section4Steps.includes(currentSection) && index === 3)
        )}, { 'u-bg-gray-100': isCurrentSection(index) }]"
        @click="!sectionAnimating ? restartAnimation(index) : () => {}"
      >
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md group-hover:opacity-0 u-bg-gray-200"
          :class="isCurrentSection(index) ? 'opacity-0' : 'opacity-100'"
        >
          <img
            :src="`/assets/docs/v3/architecture/${colorMode.preference === 'dark' ? data.iconDark : data.icon}`"
            class="transition duration-200 group-hover:opacity-0"
            :class="isCurrentSection(index) ? 'opacity-0' : 'opacity-100'"
          >
        </div>
        <div
          class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 p-3 mt-4 ml-4 transition duration-200 rounded-md opacity-0 group-hover:opacity-100 bg-gradient-to-b from-green-600 to-green-400"
          :class="isCurrentSection(index) ? 'opacity-100' : 'opacity-0'"
        >
          <img
            :src="`/assets/docs/v3/architecture/${data.iconColor}`"
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
    <div class="relative flex items-end justify-center col-span-7 perspect-10">
      <div class="ml-20 perspective">
        <DocsFrameworkV3ArchitectureContainer class="rotate" :current-section="currentSection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const { data: architectureData } = await useAsyncData('architecture', () => queryContent('/docs/3.x/_collections/architecture').findOne())

const { currentSection, stopCounter, restartCounter } = useCounterAnimations()
const colorMode = useColorMode()

const root = ref(null) as Ref<Element>
const observer = ref() as Ref<IntersectionObserver>
const animationsDelay = [1500, 500, 1500, 500, 1500, 500, 1500, 500]
const section1Steps = [0, 1]
const section2Steps = [2, 3]
const section3Steps = [4, 5]
const section4Steps = [6, 7]
const sectionAnimating = ref(false)

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
  }, 1500)

  restartCounter(animationsDelay, section === 1 ? 2 : section === 2 ? 4 : section === 3 ? 6 : 0)
}

const isCurrentSection = (index) => {
  return (section1Steps.includes(currentSection.value) && index === 0) ||
    (section2Steps.includes(currentSection.value) && index === 1) ||
    (section3Steps.includes(currentSection.value) && index === 2) ||
    (section4Steps.includes(currentSection.value) && index === 3)
}

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>

<style scoped>
.rotate {
  transform: rotateY(30deg);
}

.perspective {
  perspective: 100rem;
}
</style>
