<template>
  <div class="flex items-center justify-center gap-x-12 relative">
    <img class="absolute w-full h-full -right-60 opacity-40" src="/assets/docs/v3/deploy/gradient.svg" alt="gem illustration">
    <div class="flex flex-col xl:absolute w-[600px] h-[350px] justify-center items-center right-0 top-1/2">
      <div class="absolute flex flex-col w-full md:flex-row items-center top-0 md:top-1/2" :class="currentSection === null || currentSection === 0 ? 'opacity-100' : 'opacity-0'">
        <DocsFrameworkV3DeployServer v-if="serverStep === 0" :border="serverBorder" class="absolute w-full" />
        <DocsFrameworkV3DeployServerFolder v-else class="absolute w-full" />
      </div>

      <div class="absolute transition-opacity duration-300 top-0 w-full inset-x-0 w-full" :class="[currentSection === 1 ? 'opacity-100' : 'opacity-0']">
        <DocsFrameworkV3DeployStatic class="absolute w-full" />
      </div>

      <div class="absolute flex transition-opacity duration-300 items-start md:items-center w-full top-0 md:top-1/2" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
        <DocsFrameworkV3DeployHybridServer class="absolute transition-opacity duration-100 inset-x-0 w-full" :class="hybridStep === 0 ? 'opacity-100' : 'opacity-0'" />
        <DocsFrameworkV3DeployHybridServerFolder class="absolute transition-opacity duration-100 inset-x-0 w-full" :class="hybridStep === 0 ? 'opacity-0' : 'opacity-100'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentSection: {
    type: Number,
    default: null
  }
})

const serverBorder = ref(false)
const serverStep = ref(0)
const hybridStep = ref(0)
const intervalIds = ref([])
const timeoutIds = ref([])

watch(() => props.currentSection, () => {
  if (props.currentSection === 0) {
    serverBorder.value = true

    intervalIds.value.push(setInterval(() => {
      serverStep.value = 1
      timeoutIds.value.push(setTimeout(() => {
        serverStep.value = 0
      }, 2000))
    }, 4000))
  }

  if (props.currentSection === 2) {
    intervalIds.value.push(setInterval(() => {
      hybridStep.value = 1
      timeoutIds.value.push(setTimeout(() => {
        hybridStep.value = 0
      }, 2000))
    }, 4000))
  }
})

onUnmounted(() => {
  intervalIds.value.map(id => clearInterval(id))
  timeoutIds.value.map(id => clearTimeout(id))
})
</script>
