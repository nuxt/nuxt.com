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
      <div v-if="computedFiles.length" ref="editorScroll" class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <ProjectContentEditor
          v-if="file"
          :model-value="parsedContent"
          :components="components || []"
          class="flex flex-col flex-1"
          @update:model-value="updateContent"
        />
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

const editorScroll: Ref<HTMLElement> = ref(null)

// Watch

watch(file, () => {
  // Fetch content when file changes
  fetchContent()
  // Open dirs in tree when file is selected
  openDirs()
}, { immediate: true })

// When file path change due to new selection, scroll top
if (process.client) {
  watch(file, () => {
    if (!editorScroll.value) {
      return
    }

    editorScroll.value.scrollTop = 0
  })
}

// Http

function openDirs () {
  if (!file.value) {
    return
  }

  const paths = file.value.split('/')
  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
}

async function fetchContent () {
  if (!file.value) {
    content.value = ''
    parsedContent.value = ''
    parsedMatter.value = {}
    return
  }

  const { content: fetchedContent } = await fetchFile(file.value)

  content.value = fetchedContent

  parseContent()
}

function parseContent () {
  const { content: c, matter } = parseFrontMatter(content.value)

  parsedContent.value = c
  parsedMatter.value = matter
}

async function updateFile (formattedContent) {
  try {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(file.value)}`, {
      method: 'PUT',
      params: {
        ref: branch.value,
        root
      },
      body: {
        content: formattedContent
      }
    })

    content.value = formattedContent
    draft.value = data

    $socket.emit('draft:update', `project-${project.id}:${branch.value}`)
    $socket.emit('file:update', `project-${project.id}:${branch.value}:${file.value}`)
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

  $socket.emit('file:join', `project-${project.id}:${branch.value}:${file.value}`)

  $socket.on('file:update', ({ branch: draftBranch, file: draftFile }) => {
    if (draftBranch !== branch.value) {
      return
    }
    if (draftFile.path !== file.value) {
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
