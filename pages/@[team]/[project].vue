<template>
  <div>
    <NuxtPage :team="team" :project="project" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Project } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const route = useRoute()
const client = useStrapiClient()

const { data: project } = await useAsyncData('project', () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
</script>
