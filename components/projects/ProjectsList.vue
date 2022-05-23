<template>
  <div>
    <div v-if="projects.length" class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ProjectsListItem v-for="project of projects" :key="project.id" :project="project" />
    </div>

    <p v-else class="mt-12 font-medium text-center u-text-gray-400">
      No projects match your search.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Project } from '~/types'

defineProps({
  projects: {
    type: Array as PropType<Project[]>,
    default: () => []
  }
})
</script>
