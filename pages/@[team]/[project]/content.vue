<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="file" @select-file="selectFile" />
    </template>

    <template #aside-header>
      <UButton
        v-if="branch"
        icon="mdi:source-branch"
        :label="branch.name"
        variant="secondary"
        size="xs"
      />
    </template>

    <DocusEditor :model-value="parsedContent" @update:model-value="saveContent" />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import matter from 'gray-matter'
import { unflatten, flatten } from 'flat'
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
const updatedContent: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<string> = ref('')

const { data: branches, refresh: refreshBranches } = await useAsyncData('files', () => client<Branch[]>(`/projects/${props.project.id}/branches`))

const { data: files, refresh: refreshFiles } = await useAsyncData('files', () => client<File[]>(`/projects/${props.project.id}/files`, {
  params: {
    branch: branch.value?.name
  }
}))

watch(content, () => {
  setupEditor()
}, { immediate: true })

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

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`)

  content.value = fetchedContent
}, { immediate: true })

// Fetch files when branch changes
watch(branch, async () => await refreshFiles())

function setupEditor () {
  const { content, matter } = parseFrontMatter()

  parsedContent.value = content
  parsedMatter.value = matter
}

function parseFrontMatter () {
  const { data, content: c, ...rest } = matter(content.value)

  // unflatten frontmatter data
  // convert `parent.child` keys into `parent: { child: ... }`
  const unflattenData = unflatten(data || {}, {})

  return {
    content: c.replace(/^\n/, ''),
    matter: unflattenData,
    ...rest
  }
}

function stringifyFrontMatter (content, data = {}) {
  // flatten frontmatter data
  // convert `parent: { child: ... }` into flat keys `parent.child`
  data = flatten(data, {
    // preserve arrays and their contents as is and do not waltk through arrays
    // flatten array will be like `parent.0.child` and `parent.1.child` with is not readable
    safe: true
  })

  return matter.stringify(`\n${content}`, data)
}

function saveContent (content) {
  updatedContent.value = stringifyFrontMatter(content, parsedMatter.value)
}

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
