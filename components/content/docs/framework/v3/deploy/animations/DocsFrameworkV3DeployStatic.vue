<template>
  <ul class="flex items-center justify-between w-full h-full px-8 overflow-hidden gap-x-8">
    <li
      v-for="(card, index) in 3"
      :key="index"
      class="w-full p-2 bg-white rounded-md h-[180px] border-transition border-4 relative"
      :class="
        currentStep === 1 && index === 0 ? 'border-green-400' : 'border-white'"
    >
      <div
        v-if="index !== 0"
        class="absolute -top-1 -left-2 w-[200px] h-[180px] bg-gray-900/50 dark:bg-gray-800/50 transition-opacity duration-300"
        :class="[0, 1].includes(currentStep) ? 'opacity-100' : 'opacity-0'"
      />

      <span
        class="w-full text-xs font-semibold text-right text-gray-700 "
      >index.html</span>
      <div class="w-1/2 h-2 bg-gray-400 rounded-xl" />
      <ul class=" flex flex-col gap-y-[8px] pt-2">
        <li
          v-for="(line, lineIndex) in 10"
          :key="lineIndex"
          class="rounded-xl bg-gray-200 h-[4px]"
          :class="[[1, 4, 7].includes(lineIndex) ? 'mr-2' :
            [3, 6, 9].includes(lineIndex) ? 'mr-4' :
            [0, 2].includes(lineIndex) ? 'mr-0' :
            'mr-12']"
        />
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">

const { startStepper, currentStep } = useCounterAnimations()

onMounted(() => {
  setTimeout(() => {
    startStepper([1500, 3500, 800])
  }, 900)
})

</script>

<style scoped>
.border-transition {
  transition: all 300ms ease;
}
</style>
