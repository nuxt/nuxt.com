<template>
  <ProjectLayout>
    <div ref="modalContainer" />
    <ProjectModalBranches v-model="isBranchesModalOpen" @update:modelValue="onBranchesModalChange" />
    <ProjectModalFiles v-model="isFilesModalOpen" @update:modelValue="onFilesModalChange" />

    <NuxtPage v-if="project" :team="team" />
  </ProjectLayout>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, User, SocketUser, GitHubDraft, GitHubBranch } from '~/types'

definePageMeta({
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
const client = useStrapiClient()
const { $socket } = useNuxtApp()

const { $toast } = useNuxtApp()
const { container: modalContainer } = useModal()
const { isBranchesModalOpen, isFilesModalOpen } = useProjectModals()

const activeUsers: Ref<SocketUser[]> = ref([])

const { data: project, error } = await useAsyncData(`projects-${route.params.project}`, () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
if (error.value) {
  navigateTo({ name: '@team-projects', params: { team: props.team ? props.team.slug : user.value.username } })
}

useHead({
  title: project.value.name
})

provide('project', project.value)
provide('activeUsers', activeUsers)

const { branch, branches, fetch: fetchBranches, select: selectBranch } = useProjectBranches(project.value)
const { fetch: fetchComponents } = useProjectComponents(project.value)
const {
  file: contentFile,
  draft: contentDraft,
  computedFiles: contentFiles,
  fetch: fetchContentFiles,
  select: selectContentFile,
  init: initContentFile,
  refresh: refreshContentFiles
} = useProjectFiles(project.value, 'content')
const { fetch: fetchMediaFiles, refresh: refreshMediaFiles } = useProjectFiles(project.value, 'public')

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

  // Listen to changes on branches
  $socket.on('branch:create', (createdBranch: GitHubBranch) => {
    if (!branches.value.find(b => b.name === createdBranch.name)) {
      branches.value = [...branches.value, createdBranch]
    }
  })
  $socket.on('branch:delete', (deletedBranch: GitHubBranch) => {
    if (branch.value.name === deletedBranch.name) {
      selectBranch(branches.value.find(b => b.name === project.value.repository.default_branch))

      refreshContentFiles()
      refreshMediaFiles()
    }
    if (branches.value.find(b => b.name === deletedBranch.name)) {
      branches.value = branches.value.filter(b => b.name !== deletedBranch.name)
    }
  })

  // Listen to change on draft by other collaborators
  $socket.on('draft:update', ({ branch: draftBranch, draft }: { branch: string, draft: GitHubDraft }) => {
    if (draftBranch !== branch.value.name) {
      return
    }

    contentDraft.value = draft

    const currentFile = contentFiles.value.find(file => file.path === contentFile.value.path)
    if (currentFile) {
      // If current file has been deleted, select new one
      if (currentFile.status === 'deleted') {
        initContentFile()
      }
    } else {
      // If current file does not exist anymore it means it has been renamed, select it from old path
      const renamedFile = contentFiles.value.find(file => file.oldPath === (contentFile.value.oldPath || contentFile.value.path))
      if (renamedFile) {
        selectContentFile(renamedFile)
      }
    }
  })
})

onUnmounted(() => {
  $socket.emit('project:leave', `project-${project.value.id}`)
})
</script>
