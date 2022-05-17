<template>
  <div class="flex items-center justify-center w-full h-full overflow-hidden">
    <div
      class="relative bg-white rounded-t-md w-[350px] h-[380px] p-4 mt-[46px] flex flex-col gap-y-[18px] translate-y-full border-transition ease"
      :class="[{ 'translate-y-8 duration-300': currentStep != null && currentStep >= 0 }, currentStep === 4 ? 'border-x-4 border-t-4 border-green-400 ' : 'border-white border-x-4 border-t-4']"
    >
      <span
        class="w-full text-lg font-semibold text-right text-gray-500 transition-all duration-1000 -translate-x-8 opacity-0 ease"
        :class="{ '-translate-x-0 opacity-100': currentStep > 2 }"
      >index.html</span>
      <div class="w-0 h-4 rounded-xl bg-gray-300 transition-all duration-[1.5s] ease" :class="{ 'w-[160px]': currentStep > 0 }" />
      <ul class=" flex flex-col gap-y-[14px] pt-4">
        <li
          v-for="(line, index) in 12"
          :key="index"
          class="rounded-xl bg-gray-200 h-0.5 opacity-0 duration-[2s] transition-all ease"
          :class="[{ 'h-[8px] opacity-100': currentStep > 1 }, [1, 4, 7, 10].includes(index) ? 'mr-8' :
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
    startStepper([500, 1000, 1000, 500, 2000, 800])
  }, 900)
})

</script>

<style scoped>
.border-transition {
  transition: all 500ms ease;
}
</style>
