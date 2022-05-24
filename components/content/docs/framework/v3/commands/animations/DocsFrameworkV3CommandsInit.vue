<template>
  <ul class="grid grid-cols-4 gap-6">
    <li v-for="(file, index) in animationFiles" :key="index">
      <DocsFrameworkV3CommandsFolder
        ref="files"
        :label="file"
        :folder="index === 0"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

const { currentStep, startStepper } = useCounterAnimations()

const files = ref(null)
const animationFiles = [
  'node modules', '.gitignore', 'app.vue', 'nuxt.config.ts', 'package.json', 'README.md', 'tsconfig.json'
]
const filesMotion = []

onMounted(() => {
  files.value.forEach((file) => {
    filesMotion.push(useMotion((file), {
      initial: {
        opacity: 0
      },
      in: {
        opacity: 1,
        transition: {
          delay: 500,
          duration: 400
        }
      }
    }))
  })

  filesMotion.forEach((motion) => {
    motion.set('initial')
  })
})

watch(() => props.currentSection, () => {
  if (props.currentSection === 2) {
    filesMotion[0].apply('in')
    startStepper([400, 400, 400, 400, 400, 400, 400])
  }
})

watch(currentStep, () => {
  if (currentStep.value > 0) {
    filesMotion[currentStep.value].apply('in')
  }
})
</script>
