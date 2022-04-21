<template>
  <ProjectLayout>
    <div ref="modalContainer" />
    <ProjectModalBranches v-model="isBranchesModalOpen" @update:modelValue="onBranchesModalChange" />
    <ProjectModalFiles v-model="isFilesModalOpen" @update:modelValue="onFilesModalChange" />

    <NuxtPage v-if="project" :team="team" />
  </ProjectLayout>
</template>

<script setup lang="ts">
import { init } from '@milkdown/core'
import type { PropType, Ref } from 'vue'
import type { Team, Project, User, SocketUser, GitHubDraft } from '~/types'

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

const activeUsers: Ref<SocketUser[]> = ref([])

const { data: project, error } = await useAsyncData(`projects-${route.params.project}`, () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
if (error.value) {
  router.push({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}

provide('project', project.value)
provide('activeUsers', activeUsers)

const { branch, branches, fetch: fetchBranches } = useProjectBranches(project.value)
const { fetch: fetchComponents } = useProjectComponents(project.value)
const {
  file: contentFile,
  draft: contentDraft,
  computedFiles: contentFiles,
  fetch: fetchContentFiles,
  select: selectContentFile,
  init: initContentFile
} = useProjectFiles(project.value, 'content')
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

if (process.client) {
  fetchComponents()
}

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

// Hooks

onMounted(() => {
  // Join project room
  $socket.emit('project:join', `project-${project.value.id}:${branch.value.name}`)

  // Listen to new collaborators joining the room
  $socket.on('project:active-users', (users: SocketUser[]) => {
    activeUsers.value = users
  })

  // Listen to change on draft by other collaborators
  $socket.on('draft:update', (draft: GitHubDraft) => {
    contentDraft.value = draft

    // If current file does not exist in the list of files anymore, it means it has been renamed, find it and select it
    const currentFile = contentFiles.value.find(file => file.path === contentFile.value.path)
    if (currentFile) {
      if (currentFile.status === 'deleted') {
        initContentFile()
      }
    } else {
      const renamedFile = contentFiles.value.find(file => file.oldPath === (contentFile.value.oldPath || contentFile.value.path))
      if (renamedFile) {
        selectContentFile(renamedFile)
      } else {
        initContentFile()
      }
    }
  })
})

onUnmounted(() => {
  $socket.emit('project:leave', `project-${project.value.id}`)
})
</script>
