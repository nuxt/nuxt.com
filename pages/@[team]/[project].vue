<template>
  <div>
    <NuxtPage v-if="project" :team="team" :project="project" />
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const user = useStrapiUser() as Ref<User>
const route = useRoute()
const router = useRouter()
const client = useStrapiClient()

const { data: project, error } = await useAsyncData('project', () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
if (error.value) {
  router.push({ name: '@team', params: { team: props.team ? props.team.slug : user.value.username } })
}
</script>
