<template>
  <ProjectPage title="Settings">
    <template #aside>
      <UVerticalNavigation :links="links" v-bind="verticalNavigationProps" />
    </template>

    <NuxtPage :team="team" :project="project" />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Project } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    default: null
  }
})

const links = computed(() => {
  return [{
    label: 'General',
    to: { name: '@team-project-settings' },
    exact: true
  }, {
    label: 'Repository',
    to: { name: '@team-project-settings-repository' },
    exact: true
  }]
})

const verticalNavigationProps = {
  baseClass: 'group border-r-2 flex items-center text-sm font-medium focus:bg-gray-100 focus:outline-none w-full',
  spacingClass: 'px-6 py-2',
  activeClass: 'bg-gray-100 border-gray-800 text-gray-900',
  inactiveClass: 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
  iconBaseClass: 'mr-3 flex-shrink-0 h-6 w-6 stroke-1',
  iconActiveClass: 'text-gray-500',
  iconInactiveClass: 'text-gray-400 group-hover:text-gray-500'
}
</script>
