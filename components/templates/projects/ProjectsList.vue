<template>
  <div class="grid w-full grid-cols-1 gap-4 p-8 md:grid-cols-2 lg:grid-cols-3">
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
