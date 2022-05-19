<template>
  <div class="absolute w-full" :class="currentStep > 0 && currentStep < 10 ? 'top-8 -left-32' : 'bottom-8 -left-32'">
    <ul class="flex gap-x-4">
      <li
        v-for="(dot, index) in 4"
        :key="index"
        class="w-4 h-4 transition-opacity duration-200 rounded-full opacity-0"
        :class="[
          currentStep < 9 ? 'bg-gray-500' : 'bg-green-400',
          { 'opacity-100': ((currentStep > 0 && currentStep < 5 && index === 0) || (currentStep > 9 && currentStep < 14 && index === 3)) },
          { 'opacity-100': ((currentStep > 1 && currentStep < 6 && index === 1) || (currentStep > 10 && currentStep < 15 && index === 2)) },
          { 'opacity-100': ((currentStep > 2 && currentStep < 7 && index === 2) || (currentStep > 11 && currentStep < 16 && index === 1)) },
          { 'opacity-100': ((currentStep > 3 && currentStep < 8 && index === 3) || (currentStep > 12 && currentStep < 17 && index === 0)) },
        ]"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

const { startStepper, currentStep } = useCounterAnimations()
const stepsDelay = [100, 100, 100, 100, 100, 100, 100, 100, 100, 5000, 100, 100, 100, 100, 100, 100, 100, 100]

onMounted(() => startStepper(stepsDelay))

watch(() => props.currentSection, () => {
  if ([0, 6, 9].includes(props.currentSection)) {
    startStepper(stepsDelay)
  }
})

</script>
