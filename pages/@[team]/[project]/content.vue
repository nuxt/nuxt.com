<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="file" @select-file="selectFile" @new-file="openNewFileModal" />
    </template>

    <template #aside-header>
      <UButton
        size="xxs"
        class="-my-0.5 -mr-1"
        variant="transparent-hover"
        icon="heroicons-outline:plus"
        @click="openNewFileModal()"
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

          <p class="text-sm u-text-gray-500">
            {{ file.path }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton label="Commit" size="sm" icon="heroicons-outline:cloud-upload" trailing variant="secondary" />
        </div>
      </div>
    </template>

    <p class="flex-1 w-full pb-16 milkdown editor focus:outline-none" contenteditable @input="saveContent" v-text="parsedContent" />
    <!-- <DocusEditor :model-value="parsedContent" @update:model-value="saveContent" /> -->

    <ProjectContentNewFileModal v-model="newFileModal" :folder="newFileFolder" @submit="createFile" />
    <ProjectContentBranchesModal
      v-model="branchesModal"
      :branches="branches"
      :selected-branch="branch"
      :pending="pendingBranches"
      @select-branch="selectBranch"
      @refresh-branches="refreshBranches"
    />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { debounce } from 'lodash-es'
import { findFileFromPath } from '~/utils/tree'
import type { Team, Project, File, Branch } from '~/types'
import ProjectContentBranchesModal from '~~/components/organisms/project/content/ProjectContentBranchesModal.vue'

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
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()

const branchCookie = useCookie(`project-${props.project.id}-branch`, { path: '/' })
const branch: Ref<Branch> = ref(null)
const file: Ref<File> = ref(null)
const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<string> = ref('')
const branchesModal = ref(false)
const newFileModal = ref(false)
const newFileFolder = ref('')

const { data: branches, refresh: refreshBranches, pending: pendingBranches } = await useAsyncData('branches', () => client<Branch[]>(`/projects/${props.project.id}/branches`))

findBranch()

const { data: files, refresh: refreshFiles } = await useAsyncData('files', () => client<File[]>(`/projects/${props.project.id}/files`, {
  params: {
    ref: branch.value?.name
  }
}))

findFile()

// Select file when files changes
watch(files, findFile)

// Select branch when branches changes
watch(branches, findBranch)

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
  const { content: c, matter } = parseFrontMatter(content.value)

  parsedContent.value = c
  parsedMatter.value = matter
}, { immediate: true })

const saveContent = debounce(async (content: string) => {
  await client(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    method: 'PUT',
    body: {
      content: stringifyFrontMatter(content, parsedMatter.value),
      ref: branch.value?.name
    }
  })
}, 500)

function findFile () {
  const currentFile = file.value?.path ? findFileFromPath(file.value.path, files.value) : null

  selectFile(currentFile || files.value.find(file => file.path.toLowerCase().endsWith('index.md')) || files.value.find(file => file.type === 'file'))
}

function selectFile (f: File) {
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
function openNewFileModal (path: string = '') {
  newFileFolder.value = path || ''
  newFileModal.value = true
}

async function createFile (path: string) {
  const newFile = await client<File>(`/projects/${props.project.id}/files/${encodeURIComponent(path)}`, {
    method: 'POST',
    params: {
      ref: branch.value?.name
    }
  })
  await refreshFiles()
  file.value = newFile
  newFileModal.value = false
  newFileFolder.value = ''
}
</script>

<style>
.milkdown .editor {
  width: 100%;
  height: 100%;
  max-width: 100% !important;
  padding: 0 !important;
}
</style>
