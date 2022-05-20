
<template>
  <div class="h-full w-full flex flex-row">
    <svg width="801" height="415" viewBox="0 0 801 415" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_b_3912_44322)">
        <rect width="801" height="415" rx="12" fill="#FAFAFA" />
        <rect
          x="0.5"
          y="0.5"
          width="800"
          height="414"
          rx="11.5"
          stroke="#E4E4E7"
        />
      </g>
      <defs>
        <filter
          id="filter0_b_3912_44322"
          x="-42"
          y="-42"
          width="885"
          height="499"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImage" stdDeviation="21" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_3912_44322" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_3912_44322" result="shape" />
        </filter>
      </defs>
    </svg>

    <DocsFrameworkV3RoutingPanel :current-step="currentStep" :current-section="currentSection" class="relative right-20 top-10 z-10" />
    <div class="absolute w-[801px] h-[415px] flex items-center justify-center">
      <img
        v-for="(illustration, index) in containerIllustrations"
        :key="index"
        class="absolute transition-opacity duration-1000"
        :class="currentSection === index && currentStep !== 1 ? 'opacity-100' : 'opacity-0'"
        :src="`/assets/docs/framework/v3/routing/${illustration}`"
      >
      <img
        src="/assets/docs/framework/v3/routing/middleware-dashboard-content.svg"
        class="absolute transition-opacity duration-1000"
        :class="currentStep === 1 ? 'opacity-100' : 'opacity-0'"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  containerIllustration: {
    type: Array,
    default: () => {}
  },
  currentSection: {
    type: Number,
    default: 0
  }
})

// need stepper for last section (2 steps)
const { startStepper, currentStep } = useCounterAnimations()

const containerIllustrations = ref([
  'static-route-content.svg',
  'nested-routes-content.svg',
  'dynamic-routes-content.svg',
  'middleware-login-content.svg'
])

watch(() => props.currentSection, () => {
  if (props.currentSection === 3) {
    startStepper([2000, 2000])
  }
})

</script>
