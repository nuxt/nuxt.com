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
        <ProjectContentFileEditor
          v-if="parsedContent"
          :content="parsedContent"
          :components="components || []"
          class="flex flex-col flex-1"
          @update="onMarkdownUpdate"
        />
      </div>
      <ProjectContentFilesEmpty v-else @create="openCreateFileModal('content')" />

      <ProjectContentFileAside
        :model-value="parsedContent ? parsedContent.matter : {}"
        @update:model-value="onMatterUpdate"
      />
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import { PropType, Ref } from 'vue'
import { debounce } from 'lodash-es'
import { useEditorScroll } from '~/editor/scroll'
import type { Content } from '~/editor/types'
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
const { scroll: editorScroll } = useEditorScroll(file)

const content: Ref<string> = ref('')
const parsedContent: Ref<Content | null> = ref(null)

// Methods

const openDirs = () => {
  if (!file.value) {
    return
  }

  const paths = file.value.path.split('/')
  for (let i = paths.length - 1; i > 1; i--) {
    paths.pop()
    openDir(paths.join('/'), true)
  }
}

const onMarkdownUpdate = (markdown: string) => {
  parsedContent.value.markdown = markdown
  onUpdate()
}

const onMatterUpdate = (matter: object) => {
  parsedContent.value.matter = matter
  onUpdate()
}

const onUpdate = debounce(async () => {
  const { markdown, matter } = unref(parsedContent)
  const formattedContent = stringifyFrontMatter(markdown, matter)
  if (formattedContent === content.value) {
    return
  }

  console.log({
    1: content.value,
    2: formattedContent
  })

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

    $socket.emit('draft:update', `project-${project.id}:${branch.value.name}:${root}`)
  } catch (e) {}
}, 200)

// Watch

watch(file, async (file) => {
  // Open dirs in tree to match selected file
  openDirs()

  // Fetch content
  const { content: fetchedContent } = await fetchFile(file.path)
  content.value = fetchedContent

  // Parse content
  const parsed = parseFrontMatter(content.value)

  parsedContent.value = {
    key: `project-${project.id}-${branch.value.name}-${file.path}`,
    markdown: parsed.content,
    matter: parsed.matter
  }
}, { immediate: true })

// Hooks

onMounted(() => file.value && $socket.emit('file:join', `project-${project.id}:${branch.value.name}:${file.value.path}`))
onUnmounted(() => $socket.emit('file:leave', `project-${project.id}`))
</script>

<style>
.milkdown {
  flex: 1 1 0%;
}
.milkdown > .editor {
  max-width: 100% !important;
  padding: 0 !important;
  overflow-y: visible !important;
}
</style>
