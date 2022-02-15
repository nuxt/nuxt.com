<template>
  <div class="w-full p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <ProjectsItem v-for="project of projects" :key="project.id" :project="project" />
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { Project } from '~/types'

defineProps({
  projects: {
    type: Array as PropType<Project[]>,
    default: () => []
  }
})
</script>
