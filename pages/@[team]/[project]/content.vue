<template>
  <ProjectPage>
    <template v-if="computedFiles.length" #aside>
      <div class="flex flex-col flex-1 overflow-y-hidden">
        <ProjectContentFilesTree :tree="tree" class="flex-1 overflow-y-auto" />
        <div class="flex flex-shrink-0 px-6 py-4">
          <UInput
            v-model="treeQuery"
            name="filter"
            icon="heroicons-outline:filter"
            autocomplete="off"
            placeholder="Filter..."
            class="flex w-full"
            size="sm"
            custom-class="truncate pr-10 u-bg-gray-50 -my-px placeholder-gray-400 dark:placeholder-gray-500"
          >
            <UButton
              v-if="treeQuery"
              icon="heroicons-outline:x"
              size="sm"
              variant="transparent"
              class="absolute right-1"
              @click="treeQuery = ''"
            />
          </UInput>
        </div>
      </div>
    </template>

    <template #header>
      <ProjectHeader>
        <template #extra-actions>
          <UButton
            size="xs"
            label="Create file"
            variant="gray"
            icon="heroicons-outline:plus"
            truncate
            @click="openCreateFileModal('content')"
          />
        </template>
      </ProjectHeader>
    </template>

    <div class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <div v-if="computedFiles.length" class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <ClientOnly>
          <ProjectContentEditor
            v-if="file"
            :model-value="parsedContent"
            :components="components || []"
            class="flex flex-col flex-1"
            @update:model-value="updateContent"
          />
        </ClientOnly>
      </div>
      <ProjectContentFilesEmpty v-else @create="openCreateFileModal('content')" />

      <ProjectContentFileAside :model-value="parsedMatter" @update:model-value="updateMatter" />
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { debounce } from 'lodash-es'
import type { Team, Project, GitHubDraft } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const root = 'content'
const project: Project = inject('project')

provide('root', root)

const { $socket } = useNuxtApp()
const client = useStrapiClient()
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()
const { branch } = useProjectBranches(project)
const { components } = useProjectComponents(project)
const { draft, file, fetchFile, openCreateModal: openCreateFileModal, computedFiles } = useProjectFiles(project, root)
const { query: treeQuery, tree, openDir } = useProjectFilesTree(project, root)

const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<object> = ref({})

// Watch

// Fetch content when file changes
watch(file, () => fetchContent(), { immediate: true })

// Open dirs in tree when file is selected
watch(file, (f) => {
  if (!f) {
    return
  }

  const paths = f.path.split('/')
  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
}, { immediate: true })

// Split markdown front-matter when content changes
watch(content, () => {
  if (typeof content.value !== 'string') {
    return
  }

  const { content: c, matter } = parseFrontMatter(content.value)

  parsedContent.value = c
  parsedMatter.value = matter
}, { immediate: true })

// Http

async function fetchContent () {
  if (!file.value) {
    content.value = ''
    return
  }

  const { content: fetchedContent } = await fetchFile(file.value.path)

  content.value = fetchedContent
}

async function updateFile (formattedContent) {
  try {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(file.value.path)}`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name,
        root
      },
      body: {
        content: formattedContent
      }
    })

    content.value = formattedContent
    draft.value = data

    $socket.emit('draft:update', `project-${project.id}:${branch.value.name}`)
    $socket.emit('file:update', `project-${project.id}:${branch.value.name}:${file.value.path}`)
  } catch (e) {}
}

const updateContent = debounce((newContent: string) => {
  const formattedContent = stringifyFrontMatter(newContent, parsedMatter.value)
  if (formattedContent === content.value) {
    return
  }

  return updateFile(formattedContent)
}, 500)

const updateMatter = debounce((newMatter: object) => {
  const formattedContent = stringifyFrontMatter(parsedContent.value, newMatter)
  if (formattedContent === content.value) {
    return
  }

  return updateFile(formattedContent)
}, 500)

// Hooks

onMounted(() => {
  if (!file.value) {
    return
  }

  $socket.emit('file:join', `project-${project.id}:${branch.value.name}:${file.value.path}`)

  $socket.on('file:update', ({ branch: draftBranch, file: draftFile }) => {
    if (draftBranch !== branch.value.name) {
      return
    }
    if (file.value && draftFile.path !== file.value.path) {
      return
    }

    content.value = draftFile.content
  })
})

onUnmounted(() => {
  $socket.emit('file:leave', `project-${project.id}`)
})
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
