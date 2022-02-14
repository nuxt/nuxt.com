<template>
  <div class="py-8">
    <div v-if="projects.length" class="flex flex-col sm:gap-6">
      <ProjectsItem v-for="project of projects" :key="project.id" :project="project" />
    </div>

    <TwCard v-else variant="black" body-class="px-4 py-5 sm:p-12 text-center" ring-class="ring-1 ring-tw-gray-200">
      <svg class="mx-auto h-12 w-12 text-tw-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-tw-gray-900">
        No projects
      </h3>
      <p class="mt-1 text-sm text-tw-gray-500">
        Get started by creating a new project.
      </p>
    </TwCard>
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
