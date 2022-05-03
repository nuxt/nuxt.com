<template>
  <div
    ref="mainArticle"
    class="absolute w-1/3 top-[30%] right-24 transition-colors duration-500"
    :class="[{ 'delay-500': step === 0 }, colorClass]"
  >
    <svg
      width="215"
      height="154"
      viewBox="0 0 215 154"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.96354 138.101L0.119234 5.5563C0.0559579 2.60764 2.59399 0.272256 5.52723 0.580117L205.751 21.5948C208.184 21.8502 210.055 23.8615 210.135 26.3065L214.108 148.342C214.201 151.209 211.822 153.542 208.958 153.393L7.60509 142.887C5.04325 142.754 3.01858 140.666 2.96354 138.101Z" fill="currentColor" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const props = defineProps({
  step: {
    type: Number,
    default: 0
  }
})

const colorClass = ref()
const mainArticle = ref()
const mainArticleMotion = useMotion(mainArticle,
  {
    base: {
      x: 48
    },
    enter: {
      x: 100,
      transition: {
        duration: 500,
        delay: 500,
        onComplete: () => {
          setTimeout(() => {
            colorClass.value = 'u-text-gray-200'
            mainArticleMotion.apply('leave')
          }, 1000)
        }
      }
    },
    leave: {
      x: 48,
      transition: {
        duration: 500
      }
    }
  }
)

watch(() => props.step, () => {
  if (props.step === 0 || props.step === 1) {
    mainArticleMotion.set('base')
    mainArticleMotion.apply('enter')
    colorClass.value = props.step === 0 ? 'text-green-400' : 'u-text-white'
  } else {
    if (props.step === 3) {
      colorClass.value = 'u-text-white'
      setTimeout(() => {
        colorClass.value = 'u-text-gray-200'
      }, 2300)
    } else {
      colorClass.value = 'u-text-gray-200'
    }

    mainArticleMotion.set('base')
  }
})
</script>
