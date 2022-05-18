<template>
  <div class="flex flex-row w-full h-full">
    <svg width="801" height="415" viewBox="0 0 801 415" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_b_4133_54839)">
        <rect width="801" height="415" rx="12" :fill="currentSection === 1 ? '#9d9da0' : '#FFFFFF'" />
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
          id="filter0_b_4133_54839"
          x="-42"
          y="-42"
          width="885"
          height="499"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImage" stdDeviation="21" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_4133_54839" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_4133_54839" result="shape" />
        </filter>
      </defs>
    </svg>

    <div class="pt-12 -translate-x-12 gap-y-4">
      <DocsFrameworkV3CommandsTerminal :current-section="currentSection" :class="{' translate-y-48': [3, 4].includes(currentSection) }" />
    </div>

    <div class="absolute w-[801px] h-[415px] pt-8 py-8 pr-32 rounded-lg">
      <DocsFrameworkV3CommandsInit v-if="mainCurrentSection === 0" :current-section="currentSection" />
      <DocsFrameworkV3CommandsDev
        v-if="mainCurrentSection === 1"
        :current-section="currentSection"
        @restart="() => {
          emit('restart')
          restartCounter(animationsDelay, 5)
        }"
      />
      <DocsFrameworkV3CommandsBuild v-if="mainCurrentSection === 2" :current-section="currentSection" />
      <DocsFrameworkV3CommandsPreview v-if="mainCurrentSection === 3" :current-section="currentSection" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  mainCurrentSection: {
    type: Number,
    default: 0
  }
})

const { currentSection, startCounter, restartCounter } = useCounterAnimations()
const emit = defineEmits(['restart'])
const animationsDelay = [500, 500, 4000, 10000, 3000, 3000, 3000, 3000, 3000, 3000, 2000, 1000, 3000]

onMounted(() => startCounter(animationsDelay))

watch(currentSection, () => {
  console.log(currentSection.value)
})

</script>
