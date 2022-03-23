<template>
  <ProjectLayout :project="project" :links="links">
    <div ref="modalContainer" />
    <ProjectModalBranches v-model="isBranchesModalOpen" />
    <ProjectModalFiles v-model="isFilesModalOpen" />

    <NuxtPage v-if="project" :team="team" :project="project" />
  </ProjectLayout>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

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

const { container: modalContainer } = useModal()
const { isBranchesModalOpen, isFilesModalOpen } = useProjectModals()

const { data: project, error } = await useAsyncData(`projects-${route.params.project}`, () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
if (error.value) {
  router.push({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}

provide('project', project.value)

const { branch, fetch: fetchBranches } = useProjectBranches(project.value)
const { fetch: fetchContentFiles, refresh: refreshContentFiles, isDraft: isContentDraft } = useProjectFiles(project.value, 'content')
const { fetch: fetchMediaFiles, refresh: refreshMediaFiles, isDraft: isMediaDraft } = useProjectFiles(project.value, 'public')

try {
  await fetchBranches()
} catch (e) {
  router.push({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}

try {
  await Promise.all([fetchContentFiles(), fetchMediaFiles()])
} catch (e) {}

const links = computed(() => ([
  { to: { name: '@team-project' }, icon: 'heroicons-outline:home', label: 'Home', exact: true },
  { to: { name: '@team-project-content' }, icon: 'heroicons-outline:pencil', label: 'Content', badge: isContentDraft.value },
  { to: { name: '@team-project-media' }, icon: 'heroicons-outline:photograph', label: 'Media', badge: isMediaDraft.value },
  { to: { name: '@team-project-settings' }, icon: 'heroicons-outline:cog', label: 'Settings' }
]))

// Refresh files when branch changes
watch(branch, async () => await Promise.all([refreshContentFiles(), refreshMediaFiles()]))
</script>
