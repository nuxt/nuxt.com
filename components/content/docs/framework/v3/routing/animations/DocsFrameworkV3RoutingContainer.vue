
<template>
  <div class="flex flex-row w-full h-full">
    <div class="w-[801px] h-[415px] bg-gray-100 dark:bg-gray-900 border u-border-gray-200 rounded-lg flex items-center">
      <!-- main square -->
      <div
        class="absolute transition-all duration-300 u-bg-gray-300 top-[80px]"
        :class="currentSection === 0 ? 'w-[237px] h-[151px] rounded-lg translate-x-[300px] translate-y-0 ' :
          currentSection === 1 ? 'translate-x-[228px] -translate-y-12 w-[371px] h-[143px] rounded-lg' :
          currentSection === 2 ? 'rounded-lg -translate-y-8 translate-x-[444px] w-[305px] h-[142px]' :
          currentStep === 0 ? 'w-[69px] h-[69px] translate-x-[380px] translate-y-0 rounded-lg' :
          'translate-x-0 -translate-y-20 left-0 inset-y-0 w-[39px] h-[415px] rounded-l-lg'"
      />

      <div
        class="absolute flex flex-col space-y-4 pt-[136px] transition-opacity duration-300 left-[328px]"
        :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="w-[181px] h-[21px] bg-gray-200 dark:bg-gray-600 rounded-xl" />
        <div class="flex items-center justify-center space-x-4">
          <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
          <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
        </div>
      </div>

      <div
        class="absolute flex flex-col space-y-2 pt-[180px] w-[371px] transition-opacity duration-300 justify-start left-[228px]"
        :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="bg-gray-200 dark:bg-gray-600 w-[153px] h-[13px] rounded-xl" />
        <div v-for="(line, index) in 8" :key="index" class="flex flex-col gap-y-3">
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
        class="absolute flex flex-col gap-y-6 left-[300px] pt-[80px] items-center"
        :class="currentStep === 0 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="flex flex-col gap-y-[14px]">
          <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
          <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
        </div>
        <div class="rounded-lg u-bg-gray-300 w-[79px] h-[23px]" />
      </div>

      <div class="absolute flex flex-col gap-y-[42px] left-20 top-8" :class="currentStep === 1 ? 'opacity-100' : 'opacity-0'">
        <div class="w-[172px] h-[23px] rounded-lg bg-gray-300 dark:bg-gray-600" />
        <div class="grid grid-cols-10 gap-[34px] w-[602px]">
          <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-4" />
          <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-6" />
          <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-4" />
          <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-3" />
          <div class="h-[110px] u-bg-gray-300 dark:bg-gray-600 rounded-lg col-span-3" />
        </div>
      </div>
      <DocsFrameworkV3RoutingPanel :current-step="currentStep" :current-section="currentSection" class="absolute z-10 right-40 top-12" />
    </div>
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
