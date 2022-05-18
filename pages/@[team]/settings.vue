<template>
  <Page>
    <PageGrid>
      <template #aside>
        <UVerticalNavigation :links="links" active-class="u-text-gray-900 u-bg-gray-100" />
      </template>

      <NuxtPage :team="team" />
    </PageGrid>
  </Page>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const links = computed(() => {
  return [{
    label: 'General',
    to: { name: '@team-settings' },
    icon: 'heroicons-outline:cog',
    exact: true
  }, !props.team && {
    label: 'Teams',
    to: { name: '@team-settings-teams' },
    icon: 'heroicons-outline:users'
  }, props.team && {
    label: 'Members',
    to: { name: '@team-settings-members' },
    icon: 'heroicons-outline:users'
  }].filter(Boolean)
})
</script>
