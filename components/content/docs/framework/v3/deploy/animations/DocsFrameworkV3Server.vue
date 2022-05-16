<template>
  <div class="w-full h-full flex items-center justify-center overflow-hidden">
    <div
      class="relative bg-white rounded-t-md w-[350px] h-[380px] p-4 mt-[46px] flex flex-col gap-y-[18px] border-white border-x-4 border-t-4 translate-y-full"
      :class="[{ 'translate-y-8 transition-transform duration-[3s]': currentStep != null && currentStep >= 0 }, { 'border-transition': currentStep > 3 }]"
    >
      <span
        class="w-full text-right text-lg font-semibold text-gray-500 opacity-0 -translate-x-8 transition-all duration-1000"
        :class="{ '-translate-x-0 opacity-100': currentStep > 2 }"
      >index.html</span>
      <div class="w-0 h-4 rounded-xl bg-gray-300 transition-all duration-[1.5s]" :class="{ 'w-[160px]': currentStep > 0 }" />
      <ul class=" flex flex-col gap-y-[14px] pt-4">
        <li
          v-for="(line, index) in 12"
          :key="index"
          class="rounded-xl bg-gray-200 h-0.5 opacity-0 duration-[2s] transition-all"
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
    startStepper([3000, 1500, 1500, 1000, 4000, 4000])
  }, 4000)
})

watch(currentStep, () => console.log('currentStep', currentStep.value))
</script>

<style scoped>
.border-transition {
  border-left: 4px solid #00dc82;
  border-right: 4px solid #00dc82;
  border-top: 4px solid #00dc82;

  transition: border-color 1s linear;
  -moz-transition: border-color 1s linear;    /* FF3.7+ */
  -o-transition: border-color 1s linear;      /* Opera 10.5 */
  -webkit-transition: border-color 1s linear; /* Saf3.2+, Chrome */
}
</style>
