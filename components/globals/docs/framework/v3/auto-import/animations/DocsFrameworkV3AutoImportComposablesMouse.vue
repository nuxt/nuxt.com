<template>
  <div class="flex flex-col gap-y-12 transition-opacity duration-300" :class="currentStep > 6 && currentStep < 14 || currentSection === 1 ? 'opacity-100' : 'opacity-0'">
    <div class="u-text-gray-300 font-mono text-sm flex-col gap-y-0.5">
      <div>
        <span>{{ '<' }}</span><span class="u-text-gray-500">{{ 'template' }}</span><span>{{ '>' }}</span>
      </div>
      <div class="pl-4">
        <span><span>{{ '<' }}</span><span class="u-text-gray-500">{{ 'p' }}</span><span>{{ '>' }}</span></span>
        <span>Mouse position:
          <span>{{ ' {{' }}</span><span class="text-green-400"> x </span><span>&rbrace;&rbrace;</span>
          <span>{{ ' {{' }}</span><span class="text-green-400"> y </span><span>&rbrace;&rbrace;</span></span>
        <span><span>{{ '</' }}</span><span class="u-text-gray-500">{{ 'p' }}</span><span>{{ '>' }}</span></span>
      </div>
      <div>
        <span>{{ '</' }}</span><span class="u-text-gray-500">{{ 'template' }}</span><span>{{ '>' }}</span>
      </div>
    </div>

    <div class="u-text-gray-300 font-mono text-sm flex-col gap-y-0.5">
      <div>
        <span>{{ '<' }}</span><span class="u-text-gray-500">script </span><span class="text-green-400">setup</span><span>{{ '>' }}</span>
      </div>
      <div class="relative rounded-lg ml-4 p-4 transition-opacity duration-300" :class="[{ 'opacity-0': currentStep > 2}, [1, 2].includes(currentStep) ? 'u-bg-gray-900 z-10 opacity-100' : 'u-bg-gray-800']">
        <span class="u-text-gray-500">import {</span>
        <span class="text-green-400"> useMouse </span>
        <span class="u-text-gray-500">} from `</span>
        <span class="text-green-400">./mouse.js</span>
        <span class="u-text-gray-500">`</span>
      </div>
      <div class="pl-8 transform" :class="{ '-translate-y-12': currentStep > 2 }">
        <span>
          <span class="text-blue-500">const</span> { <span class="text-cyan-400">x</span><span>, </span>
          <span class="text-cyan-400">y</span> }
          <span class="text-blue-500"> = </span>
          <span class="text-green-400">useMouse</span><span>();</span>
        </span>
      </div>
      <div class="tranform" :class="{ '-translate-y-12': currentStep > 2 }">
        <span>{{ '</' }}</span><span class="u-text-gray-500">script </span><span class="text-green-400">setup</span><span>{{ '>' }}</span>
      </div>
    </div>
    <svg viewBox="0 0 300 1" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute left-[18px] top-[155px] z-10">
      <line
        ref="line"
        y1="0.5"
        x2="300"
        y2="0.5"
        stroke="white"
        stroke-width="1"
        stroke-dasharray="300"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const { startStepper, currentStep } = useCounterAnimations()

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

const line = ref(null)

const lineMotion = useMotion(line, {
  initial: {
    strokeDashoffset: 300
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
    strokeDashoffset: 300
  }
})

lineMotion.apply('initial')

watch(() => props.currentSection, () => {
  if (props.currentSection === 1) {
    startStepper([1500, 1500, 1500, 1500, 1500, 1500, 1500])
  }
})

watch(() => currentStep.value, () => {
  if (currentStep.value === 2) {
    lineMotion.apply('in')
  } else {
    lineMotion.set('out')
  }
})
</script>
