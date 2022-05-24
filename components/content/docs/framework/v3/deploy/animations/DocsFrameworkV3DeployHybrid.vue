<template>
  <div class="relative w-full h-full overflow-hidden">
    <ul class="flex items-center justify-between w-full h-full px-8 overflow-hidden pl-60 gap-x-8">
      <li
        v-for="(card, index) in 2"
        :key="index"
        class="w-[160px] p-2 bg-white rounded-md h-[180px] border-transition border-4 border-transparent relative"
      >
        <div
          class="absolute -top-1 -left-2 w-[200px] h-[180px] bg-gray-900/50 dark:bg-gray-800/50 transition-all duration-1000"
          :class="currentStep > 0 ? 'opacity-100' : 'opacity-0'"
        />
        <span
          class="w-full text-xs font-semibold text-right text-gray-700"
        >
          index.html
        </span>
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
    <div
      class="absolute top-[124px] left-12 p-2 bg-white rounded-md border-transition border-4 border-transparent"
      :class="[currentStep > 1 ? 'w-[400px] h-[380px] translate-x-[68px] -translate-y-12 z-[1]' : 'w-[160px] h-[180px]', currentStep === 5 ? 'border-x-4 border-t-4 border-green-400 ' : 'border-white border-x-4 border-t-4']"
    >
      <span
        class="w-full text-xs font-semibold text-right text-gray-700 transition-all duration-1000"
        :class="{ 'text-lg': currentStep > 1 }"
      >
        index.html
      </span>
      <div class="w-0 h-4 mt-4 transition-all duration-500 bg-gray-300 rounded-xl" :class="{ 'w-[160px]': currentStep > 2 }" />
      <ul class=" flex flex-col gap-y-[14px] pt-4">
        <li
          v-for="(line, index) in 12"
          :key="index"
          class="rounded-xl bg-gray-200 h-0.5 opacity-0 duration-500 transition-all"
          :class="[{ 'h-[8px] opacity-100': currentStep > 3 }, [1, 4, 7, 10].includes(index) ? 'mr-8' :
            [3, 6, 9].includes(index) ? 'mr-16' :
            [0, 2].includes(index) ? 'mr-0' :
            'mr-36']"
        />
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">

const { startStepper, currentStep } = useCounterAnimations()

onMounted(() => {
  setTimeout(() => {
    startStepper([500, 500, 1000, 1000, 1000, 1000, 800])
  }, 900)
})

</script>

<style scoped>
.border-transition {
  transition: all 500ms linear;
}
</style>
