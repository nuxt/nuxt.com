<template>
  <ProjectLayout>
    <div ref="modalContainer" />
    <ProjectModalBranches v-model="isBranchesModalOpen" @update:modelValue="onBranchesModalChange" />
    <ProjectModalFiles v-model="isFilesModalOpen" @update:modelValue="onFilesModalChange" />

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
const { $socket } = useNuxtApp()

const { $toast } = useNuxtApp()
const { container: modalContainer } = useModal()
const { isBranchesModalOpen, isFilesModalOpen } = useProjectModals()

const { data: project, error } = await useAsyncData(`projects-${route.params.project}`, () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
if (error.value) {
  router.push({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}

provide('project', project.value)

const { branches, fetch: fetchBranches } = useProjectBranches(project.value)
const { fetch: fetchContentFiles } = useProjectFiles(project.value, 'content')
const { fetch: fetchMediaFiles } = useProjectFiles(project.value, 'public')

try {
  await fetchBranches()
} catch (e) {}

if (!branches.value.length && process.client) {
  $toast.error({ title: 'No branches found', description: 'Make sure your repository is properly setup.' })
}

try {
  await Promise.all([fetchContentFiles(), fetchMediaFiles()])
} catch (e) {}

function onBranchesModalChange () {
  if (isFilesModalOpen.value) {
    isFilesModalOpen.value = false
  }
}

function onFilesModalChange () {
  if (isBranchesModalOpen.value) {
    isBranchesModalOpen.value = false
  }
}

onMounted(() => {
  $socket.emit('join', `project-${project.value.id}`)
})

onUnmounted(() => {
  $socket.emit('leave', `project-${project.value.id}`)
})
</script>
