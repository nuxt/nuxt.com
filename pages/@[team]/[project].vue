<template>
  <ProjectLayout :project="project" :links="links">
    <NuxtPage v-if="project" :team="team" :project="project" />
  </ProjectLayout>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

const links = [
  { to: { name: '@team-project' }, icon: 'heroicons-outline:home', label: 'Home', exact: true },
  { to: { name: '@team-project-content' }, icon: 'heroicons-outline:pencil', label: 'Content' },
  { to: { name: '@team-project-media' }, icon: 'heroicons-outline:photograph', label: 'Media' },
  { to: { name: '@team-project-settings' }, icon: 'heroicons-outline:cog', label: 'Settings' }
]

definePageMeta({
  middleware: 'auth',
  layout: false
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
  router.push({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}
</script>
