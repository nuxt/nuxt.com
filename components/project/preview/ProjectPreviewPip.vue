<template>
  <div class="hidden lg:block">
    <div v-if="isExpanded" class="absolute inset-0 bg-gray-900/75 cursor-pointer z-50" @click="isExpanded = false" />
    <div
      class="fixed rounded-lg shadow-xl ring-1 u-ring-gray-200 overflow-hidden aspect-video z-50 group"
      :class="{
        'inset-10': isExpanded,
        'bottom-10 right-10': !isExpanded
      }"
    >
      <div v-if="!isExpanded" class="absolute inset-0 bg-gray-900/75 cursor-pointer flex items-center justify-center" @click="isExpanded = true">
        <p class="text-sm text-white italic font-medium hidden group-hover:block">
          Click to expand
        </p>
      </div>

      <iframe v-if="previewUrl" id="iframe" :src="previewUrl" class="w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

const { previewUrl } = useProjectFiles(project, 'content')

const isExpanded = ref(false)
</script>
