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
const animTimeoutIds = ref([])
const animIntervalIds = ref([])

watch(() => props.currentSection, () => {
  if (props.currentSection === 0 || props.currentSection === 2) {
    sectionAnim(props.currentSection === 0)
  }

  if (props.currentSection !== 0) {
    serverBorder.value = false
    serverStep.value = 0
    clearSectionAnim()
  }
  if (props.currentSection !== 2) {
    clearSectionAnim(false)
    hybridStep.value = 0
  }
})

const sectionAnim = (server) => {
  serverBorder.value = server

  animIntervalIds.value.push({
    id: setInterval(() => {
      server ? serverStep.value = 1 : hybridStep.value = 1

      animTimeoutIds.value.push({
        id: setTimeout(() => {
          server ? serverStep.value = 0 : hybridStep.value = 0
        }, 2000),
        serverAnim: server
      })
    }, 4000),
    serverAnim: server
  })
}

const clearSectionAnim = (server = true) => {
  animIntervalIds.value.filter(anim => anim.serverAnim === server).map(anim => clearInterval(anim.id))
  animTimeoutIds.value.filter(anim => anim.serverAnim === server).map(anim => clearTimeout(anim.id))
}

onUnmounted(() => {
  animIntervalIds.value.map(anim => clearInterval(anim.id))
  animTimeoutIds.value.map(anim => clearTimeout(anim.id))
})
</script>
