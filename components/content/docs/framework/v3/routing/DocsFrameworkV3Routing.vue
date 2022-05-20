<template>
  <div ref="root" class="grid pt-12 grid-rows-12 gap-y-12">
    <ul class="flex items-center row-span-3 gap-x-16">
      <li
        v-for="(data, index) in routingData.routings"
        :key="data.title"
        class="flex flex-col items-center justify-center cursor-pointer gap-y-2"
        :class="sectionAnimating && currentSection !== index ? 'opacity-50 cursor-auto' : 'opacity-100'"
        @click="!sectionAnimating ? restartAnimation(index) : () => {}"
      >
        <div class="relative">
          <img src="/assets/docs/framework/v3/routing/hexagon.svg" alt="hexagon container" class="h-20 w-22">
          <div class="absolute top-0 flex items-center justify-center w-full h-full ">
            <img
              :src="`/assets/docs/framework/v3/routing/${data.icon}`"
              class="absolute w-12 h-12 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/assets/docs/framework/v3/routing/${data.iconColor}`"
              class="absolute w-12 h-12 transition-opacity duration-0"
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
    <div class="relative flex items-center justify-center w-full h-full row-span-9">
      <DocsFrameworkV3RoutingContainer :current-section="currentSection" class="flex items-start" />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Ref } from 'vue'

const { data: routingData } = await useAsyncData('file-system-routing', () => queryContent('/docs/framework/v3/_collections/routing').findOne())

const { currentSection, restartCounter, stopCounter } = useCounterAnimations()

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>
const sectionAnimating = ref(false)
const animationsDelay = [4000, 4000, 4000, 4000]

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
  }, 4000)

  restartCounter(animationsDelay, section)
}
</script>
