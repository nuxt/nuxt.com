<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :tree="tree" :selected-file="file" @selectFile="selectFile" @createFile="openCreateFileModal" @deleteFile="openDeleteFileDialog" />
    </template>

    <template #aside-header>
      <UButton
        size="xxs"
        class="-my-0.5 -mr-1"
        variant="transparent-hover"
        icon="heroicons-outline:plus"
        @click="openCreateFileModal()"
      />
    </template>

    <template #header>
      <div class="flex items-center justify-between flex-1 gap-3">
        <div class="flex items-center gap-3">
          <UButton
            v-if="branch"
            icon="mdi:source-branch"
            :label="branch.name"
            variant="secondary"
            size="xs"
            @click="branchesModal = true"
          />

          <p v-if="file" class="text-sm u-text-gray-500">
            {{ file.path }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton label="Commit" size="sm" icon="heroicons-outline:cloud-upload" trailing variant="secondary" />
        </div>
      </div>
    </template>

    <p class="flex-1 w-full pb-16 milkdown editor focus:outline-none" contenteditable @input="updateFile($event.target.innerText)" v-text="parsedContent" />

    <!-- <DocusEditor :model-value="parsedContent" :theme="theme" @update:model-value="updateFile" /> -->

    <ProjectContentCreateFileModal v-model="createFileModal" :folder="createFileFolder" @submit="createFile" />
    <ProjectContentCreateBranchModal v-model="createBranchModal" :branch="createBranchName" @create-branch="createBranch" />
    <ProjectContentBranchesModal
      v-model="branchesModal"
      :branches="branches"
      :selected-branch="branch"
      :pending="pendingBranches"
      @select-branch="selectBranch"
      @refresh-branches="refreshBranches"
      @create-branch="openCreateBranchModal"
    />

    <UAlertDialog
      v-model="deleteFileDialog"
      icon="heroicons-outline:x"
      icon-class="text-red-600"
      icon-wrapper-class="w-12 h-12 bg-red-100 sm:h-10 sm:w-10"
      :title="`Delete “${deleteFilePath}”`"
      description="Are you sure you want to delete this file?"
      @confirm="deleteFile()"
    />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { debounce, sortBy } from 'lodash-es'
import { mapTree } from '~/utils/tree'
import type { Team, Project, Branch, GitHubDraft, GitHubFile } from '~/types'

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

const colorMode = useColorMode()
const client = useStrapiClient()
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()

const branchCookie = useCookie(`project-${props.project.id}-branch`, { path: '/' })
const branch: Ref<Branch> = ref(null)
const files: Ref<GitHubFile[]> = ref(null)
const file: Ref<GitHubFile> = ref(null)
const draft: Ref<GitHubDraft> = ref(null)
const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<string> = ref('')
const branchesModal = ref(false)
const createBranchModal = ref(false)
const createBranchName = ref('')
const createFileModal = ref(false)
const createFileFolder = ref('')
const deleteFileDialog = ref(false)
const deleteFilePath = ref('')

const { data: branches, refresh: refreshBranches, pending: pendingBranches } = await useAsyncData('branches', () => client<Branch[]>(`/projects/${props.project.id}/branches`))

findBranch()

const { refresh: refreshFiles } = await useAsyncData('files', async () => {
  const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${props.project.id}/files`, {
    params: {
      ref: branch.value?.name
    }
  })

  files.value = data.files
  draft.value = data.draft
})

// Select file when files changes
watch(files, () => findFile())

// Select branch when branches changes
watch(branches, () => findBranch())

// Fetch content when file changes
watch(file, async () => {
  if (!file.value) {
    return
  }

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    params: {
      ref: branch.value?.name
    }
  })

  content.value = fetchedContent
}, { immediate: true })

// Fetch files when branch changes
watch(branch, async () => await refreshFiles())

// Split markdown front-matter when content changes
watch(content, () => {
  if (!content.value) {
    return
  }

  const { content: c, matter } = parseFrontMatter(content.value)

  parsedContent.value = c
  parsedMatter.value = matter
}, { immediate: true })

// Computed

const computedFiles = computed(() => {
  if (!draft.value) {
    return files.value
  }

  const { additions, deletions } = draft.value || {}

  const computedFiles = [...files.value]
  for (const addition of additions) {
    if (addition.new) {
      computedFiles.push({ path: addition.path, type: 'blob', status: 'created' })
    } else {
      const file = computedFiles.find(f => f.path === addition.path)
      if (file) {
        file.status = 'updated'
      }
    }
  }
  for (const deletion of deletions) {
    const file = computedFiles.find(f => f.path === deletion.path)
    if (file) {
      file.status = 'deleted'
    }
  }

  return computedFiles
})

// Do not move this, it needs to be after computedFiles
findFile()

const tree = computed(() => mapTree(sortBy(computedFiles.value, 'path')))

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')

// Methods

function findFile () {
  const currentFile = file.value?.path ? computedFiles.value.find(f => f.path === file.value.path) : null

  selectFile(currentFile || computedFiles.value.reverse().find(file => file.path.toLowerCase().endsWith('index.md')) || computedFiles.value.reverse().find(file => file.type === 'blob'))
}

function selectFile (f: GitHubFile) {
  file.value = f
}

function findBranch () {
  let branch
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

function openCreateBranchModal (name: string) {
  createBranchName.value = name
  createBranchModal.value = true
}

function openCreateFileModal (path: string = '') {
  createFileFolder.value = path || ''
  createFileModal.value = true
}

function openDeleteFileDialog (path: string = '') {
  deleteFilePath.value = path || ''
  deleteFileDialog.value = true
}

// Http

async function createBranch (name: string) {
  const branch = await client<Branch>(`/projects/${props.project.id}/branches`, {
    method: 'POST',
    body: {
      name
    }
  })

  branches.value.push(branch)

  createBranchName.value = ''
  createBranchModal.value = false
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

  createFileModal.value = false
  createFileFolder.value = ''
}

const updateFile = debounce(async (content: string) => {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    method: 'PUT',
    params: {
      ref: branch.value?.name
    },
    body: {
      content: stringifyFrontMatter(content, parsedMatter.value)
    }
  })

  draft.value = data
}, 500)

async function deleteFile () {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(deleteFilePath.value)}`, {
    method: 'DELETE',
    params: {
      ref: branch.value?.name
    }
  })

  draft.value = data

  file.value = null

  findFile()

  deleteFileDialog.value = false
  deleteFilePath.value = ''
}
</script>
