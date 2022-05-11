<template>
  <div>
    <svg viewBox="0 0 241 241" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M128.344 190.791H206.735C209.225 190.792 211.671 190.142 213.828 188.908C215.984 187.674 217.774 185.899 219.019 183.762C220.263 181.624 220.918 179.2 220.917 176.732C220.915 174.265 220.259 171.841 219.012 169.704L166.367 79.3295C165.123 77.1926 163.333 75.4181 161.177 74.1843C159.021 72.9505 156.576 72.301 154.086 72.301C151.597 72.301 149.151 72.9505 146.996 74.1843C144.84 75.4181 143.05 77.1926 141.805 79.3295L128.344 102.453L102.025 57.2355C100.78 55.0988 98.9893 53.3245 96.8329 52.091C94.6765 50.8574 92.2306 50.208 89.7408 50.208C87.251 50.208 84.8051 50.8574 82.6487 52.091C80.4924 53.3245 78.7015 55.0988 77.4561 57.2355L11.9456 169.704C10.6993 171.841 10.0426 174.265 10.0415 176.732C10.0404 179.2 10.695 181.624 11.9394 183.762C13.1838 185.899 14.9742 187.674 17.1304 188.908C19.2866 190.142 21.7327 190.792 24.2226 190.791H73.43C92.9266 190.791 107.305 182.304 117.198 165.744L141.217 124.517L154.083 102.453L192.694 168.728H141.217L128.344 190.791ZM72.6278 168.705L38.2873 168.697L89.7637 80.3365L115.448 124.517L98.2514 154.046C91.6813 164.79 84.2173 168.705 72.6278 168.705Z" fill="#00DC82" />
      <circle
        ref="circle1"
        cx="200.833"
        cy="75.3122"
        r="10.0417"
        fill="#83FFCC"
      />
      <circle
        ref="circle2"
        cx="200.833"
        cy="75.3122"
        r="10.0417"
        fill="#83FFCC"
      />
      <circle
        ref="circle3"
        cx="225.938"
        cy="135.562"
        r="10.0417"
        fill="#83FFCC"
      />
      <circle
        ref="circle4"
        cx="225.938"
        cy="25.1042"
        r="10.0417"
        fill="#83FFCC"
      />
      <circle
        ref="circle5"
        cx="55.229"
        cy="25.1045"
        r="15.0625"
        fill="#D6FFEE"
      />
      <circle
        ref="circle6"
        cx="135.562"
        cy="30.125"
        r="15.0625"
        fill="#D6FFEE"
      />
      <circle
        ref="circle7"
        cx="17.5728"
        cy="82.8438"
        r="7.53125"
        fill="#30FFAA"
      />
      <circle
        ref="circle8"
        cx="52.7188"
        cy="57.7393"
        r="7.53125"
        fill="#30FFAA"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const circle1 = ref(null)
const circle2 = ref(null)
const circle3 = ref(null)
const circle4 = ref(null)
const circle5 = ref(null)
const circle6 = ref(null)
const circle7 = ref(null)
const circle8 = ref(null)
const circlesInstance = ref([circle1, circle2, circle3, circle4, circle5, circle6, circle7, circle8])
const circlesMotion = []

onMounted(() => {
  circlesInstance.value.forEach((circle, index) => {
    circlesMotion.push(
      useMotion(circle, {
        initial: {
          opacity: 0,
          translateY: 20
        },
        in: {
          opacity: 1,
          translateY: 0,
          transition: {
            duration: 1000 * index,
            delay: 200 * index,
            repeat: Infinity
          }
        }
      })
    )
  })
  if (circlesMotion.length) {
    for (let i = 0; i < circlesMotion.length; i++) {
      circlesMotion[i].set('initial')
      circlesMotion[i].apply('in')
    }
  }
})

</script>
