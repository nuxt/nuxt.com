<template>
  <ProjectPage class="items-stretch">
    <template #header>
      <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
        <div class="flex items-center min-w-0 gap-3">
          <UButton
            v-if="branch"
            icon="mdi:source-branch"
            :label="branch.name"
            variant="secondary"
            size="xs"
            truncate
            @click="modal = true"
          />

          <p v-if="file" class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-500">
            <span class="truncate">{{ file.path }}</span>
            <UButton
              icon="heroicons-outline:external-link"
              target="_blank"
              :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${file.path}`"
              variant="transparent"
              size="xxs"
              class="!p-0"
            />
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            label="Upload"
            size="sm"
            icon="heroicons-outline:cloud-upload"
            trailing
          />
        </div>
      </div>
    </template>

    <div class="flex items-stretch">
      <ProjectFileModal />

      <div class="flex flex-col flex-1">
        <div class="flex">
          <h1 class="flex-1 text-2xl font-bold text-gray-900">
            Media library
          </h1>
        </div>

        <section class="pb-16 mt-8" aria-labelledby="gallery-heading">
          <ProjectMediaGallery :files="computedFiles" />
        </section>
      </div>
    </div>

    <ProjectCommandModal
      v-model="modal"
      :branches="branches"
      :selected-branch="branch"
      :pending-branches="pendingBranches"
      :files="computedFiles"
      @selectBranch="selectBranch"
      @refreshBranches="refreshBranches"
      @createBranch="openCreateBranchModal"
      @selectFile="selectFile"
    />

    <div ref="modalWrapper" />
  </ProjectPage>
</template>

<script setup lang="ts">
import { createApp } from 'vue'
import type { PropType, Ref } from 'vue'
import type { Team, Project, Branch, GitHubDraft, GitHubFile } from '~/types'
import ProjectContentCreateBranchModal from '~/components/organisms/project/content/ProjectContentCreateBranchModal.vue'
import ProjectContentCreateFileModal from '~/components/organisms/project/content/ProjectContentCreateFileModal.vue'
import ProjectContentRenameFileModal from '~/components/organisms/project/content/ProjectContentRenameFileModal.vue'
import ProjectContentDeleteFileModal from '~/components/organisms/project/content/ProjectContentDeleteFileModal.vue'
import ProjectContentPublishModal from '~/components/organisms/project/content/ProjectContentPublishModal.vue'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const client = useStrapiClient()
const { $toast } = useNuxtApp()

const branchCookie = useCookie(`project-${props.project.id}-branch`, { path: '/' })
const branch: Ref<Branch> = ref(null)
const files: Ref<GitHubFile[]> = ref(null)
const file: Ref<GitHubFile> = ref(null)
const draft: Ref<GitHubDraft> = ref(null)
const modalWrapper = ref(null)
const loading = ref(false)
const modal = ref(false)

// Data

const { data: branches, refresh: refreshBranches, pending: pendingBranches } = await useAsyncData(`project-${props.project.id}-branches`, () => client<Branch[]>(`/projects/${props.project.id}/branches`))

findBranch()

const { refresh: refreshFiles } = await useAsyncData(`project-${props.project.id}-files`, async () => {
  const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${props.project.id}/files`, {
    params: {
      ref: branch.value?.name,
      root: 'public',
      withContent: ['png', 'jpg', 'jpeg', 'svg', 'ico']
    }
  })

  files.value = data.files
  draft.value = data.draft
})

// Watch

// Select file when files changes
watch(files, () => findFile())

// Select branch when branches changes
watch(branches, () => findBranch())

// Fetch files when branch changes
watch(branch, async () => await refreshFiles())

// Computed

const isDraft = computed(() => {
  return draft.value?.additions?.length || draft.value?.deletions.length
})

const computedFiles = computed(() => {
  const { additions, deletions } = draft.value || {}

  const githubFiles = files.value.map(file => ({ ...file }))

  for (const addition of additions) {
    if (addition.oldPath) {
      deletions.splice(deletions.findIndex(d => d.path === addition.oldPath), 1)
      const file = githubFiles.find(f => f.path === addition.oldPath)
      if (file) {
        file.status = 'renamed'
        file.path = addition.path
      }
    } else if (addition.new) {
      githubFiles.push({ path: addition.path, type: 'blob', status: 'created' })
    } else {
      const file = githubFiles.find(f => f.path === addition.path)
      if (file) {
        file.status = 'updated'
      }
    }
  }
  for (const deletion of deletions) {
    const file = githubFiles.find(f => f.path === deletion.path)
    if (file) {
      file.status = 'deleted'
    }
  }
  return githubFiles
})

// Do not move this, it needs to be after computedFiles
findFile()

// Methods

function findFile () {
  const currentFile = file.value?.path ? computedFiles.value.find(f => f.path === file.value.path) : null

  selectFile(currentFile || computedFiles.value.find(file => file.path.toLowerCase().endsWith('index.md') && file.status !== 'deleted') || computedFiles.value.find(file => file.type === 'blob' && file.status !== 'deleted'))
}

function selectFile (f: GitHubFile) {
  file.value = f
}

function findBranch () {
  let branch: Branch
  if (branchCookie.value) {
    branch = branches.value.find(branch => branch.name === branchCookie.value)
  } else {
    branch = branches.value.find(branch => branch.name === props.project.repository.default_branch)
  }

  selectBranch(branch || branches.value[0])
}

function selectBranch (b: Branch) {
  branch.value = b
  branchCookie.value = b.name
}

function openModal (component, props) {
  // eslint-disable-next-line vue/one-component-per-file
  const modal = createApp(component, {
    ...props,
    onClose () {
      modal.unmount()
    }
  })
  modal.mount(modalWrapper.value)
}

function openCreateBranchModal (name: string, mergeDraft: boolean) {
  openModal(ProjectContentCreateBranchModal, {
    name,
    mergeDraft,
    onSubmit: createBranch
  })
}

function openCreateFileModal (path?: string) {
  openModal(ProjectContentCreateFileModal, {
    path,
    onSubmit: createFile
  })
}

function openRenameFileModal (oldPath: string) {
  openModal(ProjectContentRenameFileModal, {
    oldPath,
    onSubmit: renameFile
  })
}

function openDeleteFileModal (path: string) {
  openModal(ProjectContentDeleteFileModal, {
    path,
    onSubmit: deleteFile
  })
}

function openPublishModal () {
  openModal(ProjectContentPublishModal, {
    project: props.project,
    branch: branch.value,
    onSubmit: publish
  })
}

// Http

async function createBranch (name: string, mergeDraft: boolean) {
  const branch = await client<Branch>(`/projects/${props.project.id}/branches`, {
    method: 'POST',
    body: {
      name,
      mergeDraft
    }
  })

  branches.value.push(branch)

  selectBranch(branch)

  if (mergeDraft) {
    commit()
  }
}

async function createFile (path: string) {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files`, {
    method: 'POST',
    params: {
      ref: branch.value?.name
    },
    body: {
      path
    }
  })

  draft.value = data

  selectFile(computedFiles.value.find(file => file.path === path))
}

async function renameFile (oldPath: string, newPath: string) {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/rename`, {
    method: 'PUT',
    params: {
      ref: branch.value?.name
    },
    body: {
      files: [{
        oldPath,
        newPath
      }]
    }
  })

  draft.value = data

  if (file.value?.path === oldPath) {
    selectFile(computedFiles.value.find(file => file.path === newPath))
  }
}

async function deleteFile (path: string) {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    params: {
      ref: branch.value?.name
    }
  })

  draft.value = data

  // Select new file when deleted was selected
  if (file.value?.path === path) {
    file.value = null
    findFile()
  }
}

async function commit () {
  if (!branch.value) {
    return
  }
  if (branch.value.name === props.project.repository.default_branch) {
    return openCreateBranchModal('', true)
  }

  loading.value = true

  try {
    await client(`/projects/${props.project.id}/files/commit`, {
      method: 'POST',
      params: {
        ref: branch.value.name
      }
    })

    $toast.success({
      title: 'Changes saved!',
      description: `Your changes have been committed on ${branch.value.name} branch.`
    })

    await refreshFiles()
  } catch (e) {}

  loading.value = false
}

async function publish () {
  if (!branch.value) {
    return
  }

  loading.value = true

  try {
    await client(`/projects/${props.project.id}/branches/${encodeURIComponent(branch.value.name)}/publish`, { method: 'POST' })

    $toast.success({
      title: 'Published!',
      description: `Your branch ${branch.value.name} has been merged into ${props.project.repository.default_branch}.`
    })

    await refreshBranches()
    findBranch()
  } catch (e) {}

  loading.value = false
}
</script>
