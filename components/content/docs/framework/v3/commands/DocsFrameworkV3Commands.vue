<template>
  <div class="grid pt-12 grid-rows-12 gap-y-12">
    <ul class="flex items-center row-span-3 gap-x-16">
      <li
        v-for="(data, index) in commandsData.commands"
        :key="data.title"
        class="flex flex-col items-center justify-center cursor-pointer gap-y-2"
        :class="[{ 'cursor-auto': index === 4 }, {'opacity-50 cursor-auto': sectionAnimating && (
          (!section1Steps.includes(currentSection) && index === 0) ||
          (!section2Steps.includes(currentSection) && index === 1) ||
          (!section3Steps.includes(currentSection) && index === 2) ||
          (!section4Steps.includes(currentSection) && index === 3)
        )}]"
        @click="!sectionAnimating ? restartAnimation(index, index === 1 ? false : true) : () => {}"
      >
        <div class="relative">
          <img src="/assets/docs/framework/v3/commands/hexagon.svg" alt="hexagon container" class="h-20 w-22">
          <div class="absolute top-0 flex items-center justify-center w-full h-full ">
            <img
              :src="`/assets/docs/framework/v3/commands/${data.icon}`"
              class="absolute w-12 h-12 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="(section1Steps.includes(currentSection) && index === 0) ||
                (section2Steps.includes(currentSection) && index === 1) ||
                (section3Steps.includes(currentSection) && index === 2) ||
                (section4Steps.includes(currentSection) && index === 3) ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/assets/docs/framework/v3/commands/${data.iconColor}`"
              class="absolute w-12 h-12 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="(section1Steps.includes(currentSection) && index === 0) ||
                (section2Steps.includes(currentSection) && index === 1) ||
                (section3Steps.includes(currentSection) && index === 2) ||
                (section4Steps.includes(currentSection) && index === 3) ? 'opacity-100' : 'opacity-0'"
            >
          </div>
        </div>
        <h6
          class="text-lg transition-colors duration-0"
          :class="(section1Steps.includes(currentSection) && index === 0) ||
            (section2Steps.includes(currentSection) && index === 1) ||
            (section3Steps.includes(currentSection) && index === 2) ||
            (section4Steps.includes(currentSection) && index === 3) ? 'text-green-400' : 'u-text-gray-500'"
        >
          {{ data.title }}
        </h6>
      </li>
    </ul>
    <div class="relative flex items-center justify-center w-full h-full row-span-9">
      <DocsFrameworkV3CommandsContainer
        :current-section="currentSection"
        :section1-steps="section1Steps"
        :section2-steps="section2Steps"
        :section3-steps="section3Steps"
        :section4-steps="section4Steps"
        @restart="restartCounter(animationsDelay, 5)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

const { data: commandsData } = await useAsyncData('commands', () => queryContent('/docs/framework/v3/_collections/commands').findOne())

const { currentSection, startCounter, restartCounter } = useCounterAnimations()

const sectionAnimating = ref(false)
const animationsDelay = [500, 500, 4000, 10000, 3000, 3000, 3000, 3000, 3000, 3000, 2000, 1000, 3000]
const section1Steps = [0, 1, 2]
const section2Steps = [3, 4]
const section3Steps = [5, 6, 7, 8, 9]
const section4Steps = [10, 11, 12]

onMounted(() => {
  startCounter(animationsDelay)
})

const restartAnimation = (section: number, timeout = true) => {
  if (timeout) {
    sectionAnimating.value = true
    setTimeout(() => {
      sectionAnimating.value = false
    }, section === 0 ? 5000 : section === 1 ? 13000 : section === 2 ? 15000 : 6000)
  }

  restartCounter(animationsDelay, section === 1 ? 3 : section === 2 ? 5 : section === 3 ? 10 : 0)
}
</script>
