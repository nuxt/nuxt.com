<template>
  <ProjectPage title="Content">
    <template #aside>
      <ProjectContentFilesTree
        :tree="tree"
        :selected-file="file"
        :opened-dirs="openedDirs"
        :rename-files="renameFiles"
        @openDir="openDir"
        @selectFile="selectFile"
        @createFile="openCreateFileModal"
        @renameFile="openRenameFileModal"
        @deleteFile="openDeleteFileModal"
        @revertFile="openRevertFileModal"
        @dropFile="dropFile"
      />
    </template>

    <template #aside-header>
      <UButton
        size="xxs"
        class="-my-0.5 -mr-1"
        variant="transparent-hover"
        icon="heroicons-outline:plus"
        @click="openCreateFileModal('content')"
      />
    </template>

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
            v-if="isDraft"
            label="Save"
            :loading="loading"
            size="sm"
            icon="heroicons-outline:check"
            trailing
            @click="commit"
          />
          <UButton
            v-else-if="branch.name !== project.repository.default_branch"
            label="Publish"
            :loading="loading"
            size="sm"
            icon="heroicons-outline:cloud-upload"
            trailing
            @click="openPublishModal"
          />
        </div>
      </div>
    </template>

    <DocusEditor :model-value="parsedContent" :theme="theme" class="flex flex-col flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto" @update:model-value="updateFile" />

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
import { debounce } from 'lodash-es'
import { mapTree, findTree, renamePath, getPathDir } from '~/utils/tree'
import type { Team, Project, Branch, GitHubDraft, GitHubFile } from '~/types'
import ProjectContentCreateBranchModal from '~/components/organisms/project/content/ProjectContentCreateBranchModal.vue'
import ProjectContentCreateFileModal from '~/components/organisms/project/content/ProjectContentCreateFileModal.vue'
import ProjectContentRenameFileModal from '~/components/organisms/project/content/ProjectContentRenameFileModal.vue'
import ProjectContentDeleteFileModal from '~/components/organisms/project/content/ProjectContentDeleteFileModal.vue'
import ProjectContentRevertFileModal from '~/components/organisms/project/content/ProjectContentRevertFileModal.vue'
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

const colorMode = useColorMode()
const client = useStrapiClient()
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()
const { $toast } = useNuxtApp()

const branchCookie = useCookie(`project-${props.project.id}-branch`, { path: '/' })
const branch: Ref<Branch> = ref(null)
const files: Ref<GitHubFile[]> = ref(null)
const file: Ref<GitHubFile> = ref(null)
const draft: Ref<GitHubDraft> = ref(null)
const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<string> = ref('')
const modalWrapper = ref(null)
const loading = ref(false)
const modal = ref(false)
const openedDirs = ref({})

// Data

const { data: branches, refresh: refreshBranches, pending: pendingBranches } = await useAsyncData(`project-${props.project.id}-branches`, () => client<Branch[]>(`/projects/${props.project.id}/branches`))

findBranch()

const { refresh: refreshFiles } = await useAsyncData(`project-${props.project.id}-files`, async () => {
  const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${props.project.id}/files`, {
    params: {
      ref: branch.value?.name
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

// Fetch content when file changes
watch(file, async () => await fetchContent(), { immediate: true })

// Fetch files when branch changes
watch(branch, async () => await refreshFiles())

// Split markdown front-matter when content changes
watch(content, () => {
  if (typeof content.value !== 'string') {
    return
  }

  const { content: c, matter } = parseFrontMatter(content.value)

  parsedContent.value = c
  parsedMatter.value = matter
}, { immediate: true })

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

const tree = computed(() => {
  const files = [...computedFiles.value]
  files.sort((a, b) => a.path.localeCompare(b.path, undefined, {
    numeric: true,
    sensitivity: 'base'
  }))

  return mapTree(files)
})

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')

// Methods

function findFile () {
  const currentFile = file.value?.path ? computedFiles.value.find(f => f.path === file.value.path) : null

  selectFile(currentFile || computedFiles.value.find(file => file.path.toLowerCase().endsWith('index.md') && file.status !== 'deleted') || computedFiles.value.find(file => file.type === 'blob' && file.status !== 'deleted'))
}

function selectFile (f: GitHubFile) {
  file.value = f

  if (!f) {
    return
  }

  const paths = f.path.split('/')
  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
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

function openDir (path: string, value?: boolean) {
  openedDirs.value[path] = value !== undefined ? value : !openedDirs.value[path]
}

function dropFile (src: GitHubFile, dst: GitHubFile, position: 'above' | 'below' | 'over') {
  const filesToRename = []
  // Find files parents
  const srcDir = getPathDir(src.path)
  const dstDir = getPathDir(dst.path)
  // Find files tree
  const srcTree = findTree(src.path, tree.value)
  const dstTree = findTree(dst.path, tree.value)
  // Find files indexes in respective tree
  const srcIndex = srcTree.filter(f => f.type !== 'directory').findIndex(f => f.path === src.path)
  const dstIndex = dstTree.filter(f => f.type !== 'directory').findIndex(f => f.path === dst.path)
  // Src and dst index are the same
  const sameTree = srcDir === dstDir
  // Increment index only if src file is below / above current file or tree is different
  let index = dstIndex === -1 ? 0 : dstIndex
  if (sameTree) {
    if (position === 'below' && srcIndex > dstIndex) {
      index += 1
    } else if (position === 'above' && dstIndex > srcIndex) {
      index -= 1
    }
  } else if (position === 'below') {
    index += 1
  }

  filesToRename.push({ oldPath: src.path, newPath: renamePath(src.path, dst.path, index + 1) })

  if (sameTree) {
    if (srcIndex > dstIndex) {
      // I move a file up
      for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < srcIndex; i++) {
        filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i + 2) })
      }
    } else {
      // I move a file down
      for (let i = position === 'above' ? (dstIndex - 1) : dstIndex; i > srcIndex; i--) {
        filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
      }
    }
  } else {
    // Rename `srcTree` files after `srcIndex`
    for (let i = srcIndex + 1; i < srcTree.length; i++) {
      filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
    }
    // Rename `dstTree` files after `dstIndex`
    for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < dstTree.length; i++) {
      filesToRename.push({ oldPath: dstTree[i].path, newPath: renamePath(dstTree[i].path, dstTree[i].path, i + 2) })
    }
  }

  renameFiles(filesToRename.filter(f => f.oldPath !== f.newPath))
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

function openRevertFileModal (path: string) {
  openModal(ProjectContentRevertFileModal, {
    path,
    onSubmit: revertFile
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

async function fetchContent () {
  if (!file.value) {
    content.value = ''
    return
  }

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    params: {
      ref: branch.value?.name
    }
  })

  content.value = fetchedContent
}

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

const updateFile = debounce(async (newContent: string) => {
  if (!file.value) {
    return
  }

  const formattedContent = stringifyFrontMatter(newContent, parsedMatter.value)

  if (formattedContent === content.value) {
    return
  }

  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    method: 'PUT',
    params: {
      ref: branch.value?.name
    },
    body: {
      content: formattedContent
    }
  })

  content.value = formattedContent
  draft.value = data
}, 500)

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

async function renameFiles (files) {
  if (!files.length) {
    return
  }

  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/rename`, {
    method: 'PUT',
    params: {
      ref: branch.value?.name
    },
    body: {
      files
    }
  })

  draft.value = data
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

async function revertFile (path: string) {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(path)}/revert`, {
    method: 'POST',
    params: {
      ref: branch.value?.name
    }
  })

  const oldFilePath = draft.value.additions.find(addition => addition.path === path)?.oldPath

  draft.value = data

  const currentFileExists = !!computedFiles.value.find(f => f.path === file.value?.path)

  if (!currentFileExists) {
    if (oldFilePath) {
      // Select old file
      const oldFile = computedFiles.value.find(f => f.path === oldFilePath)
      selectFile(oldFile)
    } else {
      // Select new file when reverted file no longer exists
      file.value = null
      findFile()
    }
  } else {
    // No new selection, fetch new content
    await fetchContent()
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

<style>
.milkdown {
  flex: 1 1 0%;
}
.milkdown > .editor {
  max-width: 100% !important;
  padding: 0 !important;
}
</style>
