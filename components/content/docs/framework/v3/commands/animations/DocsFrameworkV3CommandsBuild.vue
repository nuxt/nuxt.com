<template>
  <div class="relative">
    <ul class="grid grid-cols-4 gap-6">
      <li v-for="(file, index) in animationFiles" :key="index" :class="currentSection === 6 ? 'z-10' : 'z-0'">
        <DocsFrameworkV3CommandsFolder
          v-if="!(currentSection > 6 && index > 6)"
          ref="files"
          :label="file"
          :folder="index === 0 && currentSection < 7"
        />
      </li>
    </ul>
    <div class="relative">
      <div class="absolute w-[801px] h-[415px] pt-8 py-8 pr-32 rounded-lg -top-[247px] transition-colors duration-300" :class="[6, 7].includes(currentSection) ? 'bg-gray-800/25 z-[1]' : 'bg-transparant'" />
      <div class="absolute w-[130px] h-[130px] bg-white -top-[235px] left-2 border z-[5] rounded-lg transition-opacity duration-300" :class="[6, 7].includes(currentSection) ? 'opacity-100' : 'opacity-0'" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

const animationFiles = ref([
  'node modules', '.gitignore', 'app.vue', 'nuxt.config.ts', 'package.json', 'README.md', 'tsconfig.json'
])

watch(() => props.currentSection, () => {
  if (props.currentSection === 8) {
    animationFiles.value.splice(0, 1)
  }
})
</script>
