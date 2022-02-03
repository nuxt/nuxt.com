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
import type { Ref } from 'vue'
import type { Team, User } from '~/types'

const route = useRoute()
const user = useStrapiUser() as Ref<User>
const team: Ref<Team> = ref(null)
const { findOne } = useStrapi4()

if (route.params.team !== 'dashboard' && route.params.team !== user.value.username) {
  const { data } = await useAsyncData('team', () => findOne<Team>('teams', route.params.team as string))

  team.value = data.value
}

const links = computed(() => {
  const to = `/${route.params.team}/settings`

  return [{
    label: 'General',
    to,
    icon: 'heroicons-outline:cog',
    exact: true
  }, {
    label: 'Billing',
    to: `${to}/billing`,
    icon: 'heroicons-outline:cash',
    exact: true
  }, {
    label: 'Members',
    to: `${to}/members`,
    icon: 'heroicons-outline:users',
    exact: true
  }]
})
</script>
