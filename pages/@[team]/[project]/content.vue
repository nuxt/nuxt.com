<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="file" @select-file="selectFile" />
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
            @click="branchModal = true"
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

    <DocusEditor :model-value="parsedContent" @update:model-value="saveContent" />

    <UModal
      v-model="branchModal"
      header-class
      body-class="flex-1 h-80 lg:overflow-y-auto"
    >
      <template #header>
        <UInput
          v-model="branchQuery"
          name="branchQuery"
          placeholder="Search branch..."
          icon="heroicons-outline:search"
          appearance="none"
          class="w-full pl-1"
          size="xl"
          autofocus
        />
      </template>

      <div v-if="filteredBranches?.length" class="divide-y u-divide-gray-200">
        <div v-for="b in filteredBranches" :key="b.name" class="group flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:u-bg-gray-50" @click="onBranchClick(b)">
          <div class="flex items-center gap-3 truncate">
            <UIcon name="mdi:source-branch" class="flex-shrink-0 w-4 h-4 u-text-gray-400" />
            <span class="text-sm font-medium truncate u-text-gray-700">{{ b.name }}</span>
            <UIcon v-if="branch.name === b.name" name="heroicons-outline:check" class="flex-shrink-0 w-4 h-4 text-primary-500" />
          </div>

          <UIcon
            name="heroicons-outline:chevron-right"
            class="flex-shrink-0 invisible w-5 h-5 group-hover:visible u-text-gray-400"
          />
        </div>
      </div>
      <span v-else class="block p-4 text-sm text-center u-text-gray-500">No branch matching your query</span>
    </UModal>
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
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()

const branch: Ref<Branch> = ref({ name: props.project.repository.default_branch })
const file: Ref<File> = ref(null)
const content: Ref<string> = ref('')
const updatedContent: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<string> = ref('')
const branchModal = ref(false)
const branchQuery = ref('')

const { data: branches, refresh: refreshBranches } = await useAsyncData('branches', () => client<Branch[]>(`/projects/${props.project.id}/branches`), { lazy: true })

const { data: files, refresh: refreshFiles } = await useAsyncData('files', () => client<File[]>(`/projects/${props.project.id}/files`, {
  params: {
    ref: branch.value?.name
  }
}))

const filteredBranches = computed(() => {
  return branches.value.filter(b => b.name.search(new RegExp(branchQuery.value, 'i')) !== -1)
})

// Select file when files changes
watch(files, () => {
  const currentFile = file.value?.path ? findFileFromPath(file.value.path, files.value) : null

  selectFile(currentFile || files.value.find(file => file.path.toLowerCase().endsWith('index.md')) || files.value.find(file => file.type === 'file'))
}, { immediate: true })

// Select branch when branches changes
watch(branches, () => {
  selectBranch(branches.value.find(branch => branch.name === props.project.repository.default_branch) || branches.value[0])
}, { immediate: true })

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
}

function onBranchClick (b: Branch) {
  selectBranch(b)
  branchModal.value = false
  branchQuery.value = ''
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
