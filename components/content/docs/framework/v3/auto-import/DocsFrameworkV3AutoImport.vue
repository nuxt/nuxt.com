<template>
  <div ref="root" class="grid grid-cols-12 pt-12">
    <ul class="flex flex-col col-span-3 gap-y-6">
      <li
        v-for="(data, index) in autoImportData.autoImport"
        :key="data.title"
        class="flex items-center opacity-100 cursor-pointer gap-x-4"
        :class="{ 'opacity-50 cursor-auto': sectionAnimating && (
          (!section1Steps.includes(currentSection) && index === 0) ||
          (!section2Steps.includes(currentSection) && index === 1) ||
          (!section3Steps.includes(currentSection) && index === 2)
        )}"
        @click="!sectionAnimating ? restartAnimation(index) : () => {}"
      >
        <div class="relative">
          <Hexagon class="w-16 u-text-gray-50 h-14" />
          <div class="absolute top-0 flex items-center justify-center w-16 h-14 z-1">
            <img
              :src="`/assets/docs/framework/v3/auto-import/${data.icon}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="(section1Steps.includes(currentSection) && index === 0) ||
                (section2Steps.includes(currentSection) && index === 1) ||
                section3Steps.includes(currentSection) && index === 2 ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/assets/docs/framework/v3/auto-import/${data.iconColor}`"
              class="absolute w-8 h-8 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="(section1Steps.includes(currentSection) && index === 0) ||
                (section2Steps.includes(currentSection) && index === 1) ||
                section3Steps.includes(currentSection) && index === 2 ? 'opacity-100' : 'opacity-0'"
            >
          </div>
        </div>
        <h6
          class="text-lg transition-colors duration-0"
          :class="(section1Steps.includes(currentSection) && index === 0) ||
            (section2Steps.includes(currentSection) && index === 1) ||
            section3Steps.includes(currentSection) && index === 2 ? 'text-green-400' : 'u-text-gray-500'"
        >
          {{ data.title }}
        </h6>
      </li>
    </ul>
    <div class="relative flex items-center justify-center w-full h-full col-span-9">
      <DocsFrameworkV3AutoImportContainer :current-section="currentSection" :section1-steps="section1Steps" :section2-steps="section2Steps" :section3-steps="section3Steps" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const { currentSection, restartCounter, stopCounter } = useCounterAnimations()

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>
const animationsDelay = [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 4000]
const section1Steps = [0, 1, 2, 3, 4, 5, 6]
const section2Steps = [7, 8, 9, 10, 11, 12, 13]
const section3Steps = [14]
const sectionAnimating = ref(false)

const { data: autoImportData } = await useAsyncData('autoImport', () => queryContent('/docs/framework/v3/_collections/auto-import').findOne())

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

const restartAnimation = (section: number) => {
  sectionAnimating.value = true

  setTimeout(() => {
    sectionAnimating.value = false
  }, section === 2 ? 4000 : 10500)

  restartCounter(animationsDelay, section === 1 ? 7 : section === 2 ? 14 : 0)
}
</script>
