<template>
  <Page>
    <PageGrid>
      <template #aside>
        <UVerticalNavigation :links="links" active-class="u-text-gray-900 u-bg-gray-200" />
      </template>

      <NuxtChild :team="team" />
    </PageGrid>
  </Page>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team } from '~/types'

const route = useRoute()

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const links = computed(() => {
  const to = `/${route.params.team}/settings`

  return [{
    label: 'General',
    to,
    icon: 'heroicons-outline:cog',
    exact: true
  }, {
    label: 'Members',
    to: `${to}/members`,
    icon: 'heroicons-outline:users',
    exact: true
  }]
})
</script>
