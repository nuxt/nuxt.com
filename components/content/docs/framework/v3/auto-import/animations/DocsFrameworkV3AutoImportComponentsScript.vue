<template>
  <div class="rounded-lg pl-4 py-4 pr-12 flex flex-col gap-y-0.5 z-10 transition duration-300" :class="[currentStep === 0 ? 'bg-gray-800' : 'bg-gray-900', [0, 1, 2].includes(currentStep) && stepsSection.includes(currentSection) ? 'opacity-100' : 'opacity-0']">
    <span class="font-mono text-sm text-gray-300">
      {{ '<script>' }}
    </span>
    <span class="font-mono text-sm text-gray-300 pl-4 flex flex-col gap-y-0.5">
      <span>import { <span class="text-green-400"> header </span> } from `<span class="text-green-400">./header.vue</span>`</span>
      <span>import { <span class="text-green-400"> footer </span> } from `<span class="text-green-400">./footer.vue</span>`</span>
    </span>
    <span class="font-mono text-sm text-gray-300">
      {{ '</script>' }}
    </span>
    <svg viewBox="0 0 325 1" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute left-[18px] top-[48px]">
      <line
        ref="headerLine"
        y1="0.5"
        x2="300"
        y2="0.5"
        stroke="white"
        stroke-width="1"
        stroke-dasharray="325"
      />
    </svg>
    <svg viewBox="0 0 325 1" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute left-[18px] top-[70px]">
      <line
        ref="footerLine"
        y1="0.5"
        x2="300"
        y2="0.5"
        stroke="white"
        stroke-width="1"
        stroke-dasharray="325"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  },
  stepsSection: {
    type: Array,
    default: () => []
  }
})

const { startStepper, currentStep } = useCounterAnimations()

const headerLine = ref(null)
const footerLine = ref(null)
const lines = ref([headerLine, footerLine])
const linesMotion = ref([])
const stepsDelay = [1500, 1500, 1500, 1500, 1500, 1500, 1500]

lines.value.forEach((line) => {
  linesMotion.value.push(
    useMotion(line, {
      initial: {
        strokeDashoffset: 325
      },
      in: {
        opacity: 0.8,
        strokeDashoffset: 0,
        transition: {
          duration: 400,
          ease: 'circOut'
        }
      },
      out: {
        opacity: 0,
        strokeDashoffset: 330
      }
    })
  )
})

onMounted(() => startStepper(stepsDelay))

linesMotion.value.forEach((instance) => {
  instance.apply('initial')
})

watch(() => currentStep.value, () => {
  if (currentStep.value === 2) {
    linesMotion.value.forEach((instance) => {
      instance.apply('in')
    })
  } else {
    linesMotion.value.forEach((instance) => {
      instance.apply('out')
    })
  }
})

watch(() => props.currentSection, () => {
  if (props.currentSection === 0) {
    startStepper(stepsDelay)
  }
})
</script>
