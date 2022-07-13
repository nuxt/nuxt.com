
<template>
  <div class="relative w-[801px] h-[415px] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center shadow-xl backdrop-blur-sm bg-opacity-50 ">
    <!-- main square -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center space-y-4 transition-opacity duration-300"
      :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'"
    >
      <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[237px] h-[151px]" />
      <div class="w-[181px] h-[21px] bg-gray-200 dark:bg-gray-600 rounded-xl" />
      <div class="flex items-center justify-center space-x-4">
        <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
        <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
      </div>
    </div>

    <div
      class="absolute inset-0 flex flex-col items-center justify-center space-y-2 transition-opacity duration-300"
      :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'"
    >
      <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[371px] h-[143px]" />
      <div v-for="(line, index) in 8" :key="index" class="flex flex-col gap-y-3" :class="index === 0 ? 'w-[150px] self-start ml-[215px]' : 'w-[371px]' ">
        <div class="w-full bg-gray-200 dark:bg-gray-600 h-[11px] rounded-xl" />
      </div>
    </div>

    <div
      class="absolute flex flex-col gap-y-[82px] pt-[82px] justify-between left-8"
      :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'"
    >
      <div class="flex flex-col gap-y-[18px]">
        <div class="w-[216px] h-5 rounded-xl bg-gray-200 dark:bg-gray-600" />
        <div class="flex flex-col gap-y-[6px]">
          <div class="rounded-lg bg-gray-200 dark:bg-gray-600 w-[89px] h-3" />
          <div class="rounded-lg bg-gray-200 dark:bg-gray-600 w-[111px] h-3" />
        </div>
      </div>
      <div class="flex pb-8 gap-x-12">
        <div v-for="(line, index) in 3" :key="index" class="w-[207px] h-[142px] bg-gray-200 dark:bg-gray-600 rounded-lg" />
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-center w-full h-full gap-y-6"
      :class="currentSection === 3 ? 'opacity-100' : 'opacity-0'"
    >
      <div class="flex flex-col gap-y-[14px] items-center">
        <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[69px] h-[69px]" />
        <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
        <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
      </div>
      <div class="rounded-lg u-bg-gray-300 w-[79px] h-[23px]" />
    </div>

    <!-- <div class="absolute flex flex-col gap-y-[42px] left-20 top-8" :class="currentStep === 1 ? 'opacity-100' : 'opacity-0'">
      <div class="w-[172px] h-[23px] rounded-lg bg-gray-300 dark:bg-gray-600" />
      <div class="grid grid-cols-10 gap-[34px] w-[602px]">
        <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-4" />
        <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-6" />
        <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-4" />
        <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-3" />
        <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-3" />
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

// need stepper for last section (2 steps)
const { startStepper, currentStep } = useCounterAnimations()

watch(() => props.currentSection, () => {
  if (props.currentSection === 3) {
    startStepper([2000, 2000])
  }
})
</script>
