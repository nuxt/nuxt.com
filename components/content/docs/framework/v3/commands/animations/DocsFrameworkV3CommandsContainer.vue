<template>
  <div class="flex flex-row w-full h-full">
    <div class="flex">
      <div class="w-[801px] h-[415px] pt-8 py-8 pr-32 rounded-lg" :class="currentSection === 1 ? 'border-none bg-gray-600' : 'bg-gray-100 dark:bg-gray-900 border border-gray-50 dark:border-gray-800'">
        <DocsFrameworkV3CommandsInit v-if="section1Steps.includes(currentSection)" :current-section="currentSection" />
        <DocsFrameworkV3CommandsDev
          v-if="section2Steps.includes(currentSection)"
          :current-section="currentSection"
          @restart="() => {
            emit('restart')
          }"
        />
        <DocsFrameworkV3CommandsBuild v-if="section3Steps.includes(currentSection)" :current-section="currentSection" />
        <DocsFrameworkV3CommandsPreview v-if="section4Steps.includes(currentSection)" :current-section="currentSection" />
      </div>
      <div class="pt-12 -translate-x-12 gap-y-4">
        <DocsFrameworkV3CommandsTerminal :current-section="currentSection" :class="{' translate-y-48': [3, 4].includes(currentSection) }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: 0
  },
  section1Steps: {
    type: Array,
    default: () => []
  },
  section2Steps: {
    type: Array,
    default: () => []
  },
  section3Steps: {
    type: Array,
    default: () => []
  },
  section4Steps: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['restart'])
</script>
