<template>
  <div>
    <Tabs v-if="!($route.name as string).startsWith('team-new')" />

    <NuxtNestedPage :team="team" />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Team, User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const user = useStrapiUser() as Ref<User>
const route = useRoute()
const { findOne } = useStrapi4()

const team: Ref<Team> = ref(null)
if (route.params.team !== 'dashboard' && route.params.team !== user.value.username) {
  const { data } = await useAsyncData('team', () => findOne<Team>('teams', route.params.team as string))

  team.value = data.value
}
</script>
