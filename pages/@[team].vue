<template>
  <div>
    <NuxtPage :team="team" />
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
const router = useRouter()
const { findOne } = useStrapi4()

const team: Ref<Team> = ref(null)
if (route.params.team !== user.value.username) {
  const { data, error } = await useAsyncData('team', () => findOne<Team>('teams', route.params.team as string))
  if (error.value) {
    router.push({ name: '@team', params: { team: user.value.username } })
  }

  team.value = data.value
}
</script>
