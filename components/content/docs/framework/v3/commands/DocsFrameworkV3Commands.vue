<template>
  <div class="grid pt-12 grid-rows-12 gap-y-12">
    <ul class="flex items-center row-span-3 gap-x-16">
      <li
        v-for="(data, index) in commandsData.commands"
        :key="data.title"
        class="flex flex-col items-center justify-center gap-y-2"
      >
        <div class="relative">
          <img src="/docs/framework/v3/commands/hexagon.svg" alt="hexagon container" class="h-20 w-22">
          <div class="absolute top-0 flex items-center justify-center w-full h-full ">
            <img
              :src="`/docs/framework/v3/commands/${data.icon}`"
              class="absolute w-12 h-12 transition-opacity duration-0"
              :alt="`${data.title} icon`"
              :class="currentSection === index ? 'opacity-0' : 'opacity-100'"
            >
            <img
              :src="`/docs/framework/v3/commands/${data.iconColor}`"
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
      <DocsFrameworkV3CommandsContainer :main-current-section="currentSection" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { currentSection, startCounter } = useCounterAnimations()
// 4s for each animation
const animationsDelay = [7000, 6000, 15000, 8000]

onMounted(() => {
  startCounter(animationsDelay)
})

const { data: commandsData } = await useAsyncData('commands', () => queryContent('/docs/framework/v3/_collections/commands').findOne())
</script>
