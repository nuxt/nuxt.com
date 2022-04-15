<template>
  <div>
    <div v-if="projects.length" class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ProjectsItem v-for="project of projects" :key="project.id" :project="project" />
    </div>

    <p v-else class="u-text-gray-400 font-medium text-center mt-12">
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
