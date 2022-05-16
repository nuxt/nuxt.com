<template>
  <div ref="leftContent" class="absolute w-full top-[30%] transition-colors duration-500" :class="classColor">
    <svg width="222" height="83" viewBox="0 0 222 83" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20.8969V4.40569C0 2.23157 1.87785 0.533135 4.04105 0.750735L100.246 10.4281C102.087 10.6133 103.503 12.1391 103.55 13.9889L103.973 30.4655C104.029 32.6757 102.135 34.4348 99.9351 34.2148L3.30789 24.5521C1.43004 24.3643 0 22.7842 0 20.8969Z" fill="currentColor" />
      <path d="M1.22461 52.5734V44.6376C1.22461 43.2048 2.44914 42.0781 3.87691 42.1971L219.383 60.1559C220.652 60.2617 221.628 61.3227 221.628 62.5964V69.9336C221.628 71.3636 220.408 72.4894 218.983 72.3746L3.4769 55.0144C2.20477 54.9119 1.22461 53.8496 1.22461 52.5734Z" fill="currentColor" />
      <path d="M1.22461 70.911V62.9741C1.22461 61.5526 2.43089 60.4298 3.84875 60.5315L144.05 70.5881C145.331 70.68 146.324 71.7463 146.324 73.0308V80.376C146.324 81.7935 145.124 82.9149 143.71 82.8194L3.50859 73.3543C2.22303 73.2676 1.22461 72.1995 1.22461 70.911Z" fill="currentColor" />
    </svg>
  </div>
</template>

<script setup lant="ts">
import { useMotion } from '@vueuse/motion'

const props = defineProps({
  step: {
    type: Number,
    default: 0
  }
})

const leftContent = ref(null)
const classColor = ref('u-text-gray-200')

const leftContentMotion = useMotion(leftContent,
  {
    base: {
      x: 142,
      transition: {
        duration: 500
      }
    },
    enter: {
      x: 194,
      transition: {
        duration: 500,
        delay: 500,
        onComplete: () => {
          setTimeout(() => {
            classColor.value = 'u-text-gray-200'
            leftContentMotion.apply('base')
          }, 1000)
        }
      }
    }
  }
)

watch(() => props.step, () => {
  if (props.step === 1 || props.step === 3) {
    classColor.value = 'u-text-white'

    if (props.step === 1) {
      leftContentMotion.apply('enter')
    }
  } else {
    classColor.value = 'u-text-gray-200'
  }
})
</script>
