<template>
  <div ref="layout" class="absolute top-[110px] w-[88%] transition-colors duration-500">
    <svg viewBox="0 0 574 424" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_3880_44240)">
        <path d="M52.5709 377.589L47.0885 36.509C47.0414 33.5769 49.564 31.2608 52.4814 31.5575L539.247 81.0674C541.684 81.3153 543.563 83.3246 543.647 85.7722L553.329 368.029C553.423 370.762 551.261 373.042 548.527 373.094L57.561 382.407C54.851 382.458 52.6145 380.299 52.5709 377.589Z" :fill="color" />
      </g>
      <defs>
        <filter
          id="filter0_d_3880_44240"
          x="0.0878906"
          y="0.531738"
          width="578.245"
          height="422.876"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="-11" dy="5" />
          <feGaussianBlur stdDeviation="18" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3880_44240" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3880_44240" result="shape" />
        </filter>
      </defs>
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

const layout = ref(null)
const color = ref('#ffffff')
const opacity = ref(0.3)

const layoutMotion = useMotion(layout,
  {
    base: {
      x: 20,
      transition: {
        duration: 500
      }
    },
    enter: {
      x: 72,
      transition: {
        duration: 500,
        delay: 500,
        onComplete: () => {
          opacity.value = 0.3
          setTimeout(() => {
            color.value = '#ffffff'
            layoutMotion.apply('base')
          }, 1000)
        }
      }
    }
  }
)

watch(() => props.step, () => {
  if (props.step === 3 || props.step === 1) {
    color.value = '#00dc82'
    opacity.value = 1
    if (props.step === 1) {
      layoutMotion.apply('enter')
    }
  } else {
    color.value = '#E4E4E7'
    opacity.value = 0.3
  }
})
</script>
