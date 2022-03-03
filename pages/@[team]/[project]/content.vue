<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="file" @select-file="selectFile" />
    </template>

    <template #aside-header>
      <UButton
        v-if="branch"
        icon="heroicons-solid:switch-horizontal"
        trailing
        :label="branch.name"
        variant="transparent"
        size="sm"
        class="-mr-3"
      />
    </template>

    <div class="whitespace-pre break-words text-sm font-mono focus:outline-none" contenteditable>
      {{ content }}
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, File, Branch } from '~/types'

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

const branch: Ref<Branch> = ref(null)
const file: Ref<File> = ref(null)
const content: Ref<string> = ref('')

const { data: branches, refresh: refreshBranches } = await useAsyncData('files', () => client<Branch[]>(`/projects/${props.project.id}/branches`))

const { data: files, refresh: refreshFiles } = await useAsyncData('files', () => client<File[]>(`/projects/${props.project.id}/files`, {
  params: {
    branch: branch.value?.name
  }
}))

// Select file when files changes
watch(files, () => {
  const currentFile = file.value?.path ? findFileFromPath(file.value.path, files.value) : null

  selectFile(currentFile || files.value.find(file => file.path.toLowerCase().endsWith('index.md')) || files.value.find(file => file.type === 'file'))
}, { immediate: true })

// Select branch when branches changes
watch(branches, () => {
  const branchName = localStorage.getItem(`projects-${props.project.id}-branch`)

  selectBranch((branchName && branches.value.find(branch => branch.name === branchName)) || branches.value.find(branch => branch.name === props.project.repository.default_branch) || branches.value[0])
}, { immediate: true })

// Fetch content when file changes
watch(file, async () => {
  if (!file.value) {
    return
  }

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/file`, {
    params: {
      path: file.value.path
    }
  })

  content.value = fetchedContent
}, { immediate: true })

// Fetch files when branch changes
watch(branch, async () => await refreshFiles())

function findFileFromPath (path, files) {
  for (const file of files) {
    if (file.path === path) {
      return file
    }
    if (file.children) {
      const result = findFileFromPath(path, file.children)
      if (result) { return result }
    }
  }
}

function selectFile (f: File) {
  file.value = f
}

function selectBranch (b: Branch) {
  branch.value = b
  localStorage.setItem(`projects-${props.project.id}-branch`, branch.value?.name)
}
</script>
