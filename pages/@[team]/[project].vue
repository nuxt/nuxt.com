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
import type { Team, Project, User, SocketUser, GitHubDraft, GitHubBranch } from '../../types'

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

const { data: project, error } = await useAsyncData(`projects-${route.params.team}-${route.params.project}`, () => client<Project>(props.team ? `/teams/${props.team.slug}/projects/${route.params.project}` : `/projects/${route.params.project}`))
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
  refresh: refreshContentFiles,
  select: selectContentFile,
  init: initContentFile
} = useProjectFiles(project.value, 'content')
const {
  fetch: fetchMediaFiles,
  refresh: refreshMediaFiles,
  draft: mediaDraft,
  select: selectMediaFile,
  init: initMediaFile
} = useProjectFiles(project.value, 'public')

// Data

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

// Watch

watch(branch, async () => {
  await Promise.all([refreshContentFiles(), refreshMediaFiles()])
})

// Methods

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
    if (branches.value.find(b => b.name === deletedBranch.name)) {
      if (branch.value.name === deletedBranch.name) {
        selectBranch(branches.value.find(b => b.name === project.value.repository.default_branch))
      }
      branches.value = branches.value.filter(b => b.name !== deletedBranch.name)
    }
  })

  // Listen to commit on a branch
  $socket.on('branch:commit', ({ branch: commitBranch }: { branch: string }) => {
    if (commitBranch !== branch.value.name) {
      return
    }

    refreshContentFiles()
    refreshMediaFiles()
  })

  // Listen to change on draft by other collaborators
  $socket.on('draft:update', ({ branch: draftBranch, draft: newDraft, root }: { branch: string, draft: GitHubDraft, root: 'content' | 'public' }) => {
    if (draftBranch !== branch.value.name) {
      return
    }

    const draft = root === 'content' ? contentDraft : mediaDraft
    const initFile = root === 'content' ? initContentFile : initMediaFile
    const selectFile = root === 'content' ? selectContentFile : selectMediaFile

    draft.value = newDraft

    const currentFile = contentFiles.value.find(file => file.path === contentFile.value.path)
    if (currentFile) {
      // If current file has been deleted, select new one
      if (currentFile.status === 'deleted') {
        initFile()
      }
    } else {
      // If current file does not exist anymore it means it has been renamed, select it from old path
      const renamedFile = contentFiles.value.find(file => file.oldPath === (contentFile.value.oldPath || contentFile.value.path))
      if (renamedFile) {
        selectFile(renamedFile)
      } else {
        initFile()
      }
    }
  })
})

onUnmounted(() => {
  $socket.emit('project:leave', `project-${project.value.id}`)
})
</script>
