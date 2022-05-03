<template>
  <div ref="articles" class="absolute w-full bottom-32 transition-colors duration-500" :class="classColor">
    <svg viewBox="0 0 672 114" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.1459 105.996L0.0830677 7.68376C0.0378063 3.49709 3.49527 0.119157 7.67975 0.26181L154.653 5.27226C158.562 5.40554 161.682 8.57854 161.748 12.4896L163.339 105.791C163.409 109.897 160.1 113.263 155.993 113.263H8.49226C4.46572 113.263 1.18943 110.022 1.1459 105.996Z" fill="currentColor" />
      <path d="M185.383 106.042L183.803 13.8918C183.731 9.67299 187.219 6.26033 191.435 6.4246L318.245 11.3652C322.103 11.5155 325.186 14.6262 325.302 18.4853L327.929 105.695C328.054 109.837 324.73 113.263 320.585 113.263H192.729C188.72 113.263 185.452 110.05 185.383 106.042Z" fill="currentColor" />
      <path d="M345.152 106.65L343.01 19.3475C342.923 15.8261 345.819 12.9583 349.339 13.0785L462.633 16.9471C465.855 17.0571 468.439 19.6465 468.543 22.8684L471.217 105.75C471.328 109.195 468.574 112.052 465.127 112.069L351.302 112.622C347.968 112.638 345.234 109.983 345.152 106.65Z" fill="currentColor" />
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

const articles = ref(null)
const classColor = ref('u-text-gray-200')

const articlesMotion = useMotion(articles,
  {
    base: {
      x: 142
    },
    enter: {
      x: 194,
      transition: {
        duration: 500,
        delay: 500,
        onComplete: () => {
          setTimeout(() => {
            classColor.value = 'u-text-gray-200'
            articlesMotion.apply('leave')
          }, 1000)
        }
      }
    },
    leave: {
      x: 142,
      transition: {
        duration: 500
      }
    }
  }
)

watch(() => props.step, () => {
  if (props.step === 1 || props.step === 3) {
    classColor.value = 'u-text-white'

    if (props.step === 1) {
      articlesMotion.set('base')
      articlesMotion.apply('enter')
    }
  } else {
    classColor.value = 'u-text-gray-200'
    articlesMotion.set('base')
  }
})

</script>
