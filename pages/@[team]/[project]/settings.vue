<template>
  <ProjectPage title="Settings">
    <template #aside>
      <UVerticalNavigation :links="links" v-bind="verticalNavigationProps" class="hidden lg:block" />
    </template>

    <div class="flex-1 flex flex-col overflow-y-auto">
      <UContainer class="w-full lg:hidden mt-4">
        <UVerticalNavigation :links="links" />
      </UContainer>

      <NuxtPage :team="team" class="flex-1 p-4 sm:p-6" />
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
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
    to: { name: '@team-project-settings-repository' }
  }, {
    label: 'Advanced',
    to: { name: '@team-project-settings-advanced' }
  }]
})

const verticalNavigationProps = {
  wrapperClass: '',
  baseClass: 'group border-r-2 flex items-center text-sm font-medium focus:u-bg-gray-100 focus:outline-none w-full',
  spacingClass: 'px-6 py-2',
  activeClass: 'u-bg-gray-100 u-border-gray-800 u-text-gray-900',
  inactiveClass: 'border-transparent u-text-gray-600 hover:u-text-gray-900 hover:u-bg-gray-50',
  iconBaseClass: 'mr-3 flex-shrink-0 h-6 w-6 stroke-1',
  iconActiveClass: 'u-text-gray-500',
  iconInactiveClass: 'u-text-gray-400 group-hover:u-text-gray-500'
}
</script>
