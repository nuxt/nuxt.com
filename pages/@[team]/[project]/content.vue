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
            custom-class="pr-10 -my-px placeholder-gray-400 truncate u-bg-gray-50 dark:placeholder-gray-500"
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
      <ProjectHeader
        :model-value="parsedContent ? parsedContent.matter : {}"
        @update:model-value="onMatterUpdate"
        @create-file="openCreateFileModal('content')"
      >
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
      <div v-if="computedFiles.length" ref="editorScroll" class="flex flex-col flex-1 p-4 overflow-y-auto sm:p-6">
        <ProjectContentFileEditor
          v-if="parsedContent && parsedContent.key"
          :content="parsedContent"
          :components="components || []"
          class="flex flex-col flex-1"
          @update="onMarkdownUpdate"
        />
        <p v-else class="flex items-center justify-center flex-1 u-text-gray-400">
          This file extension is not supported in editor.
        </p>
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
import { getPathExt } from '~/utils/tree'
import type { Content } from '~/editor/types'
import type { Team, Project, GitHubDraft, Root } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const root: Ref<Root> = ref('content')
const project: Ref<Project> = inject('project')

provide('root', root)

const { $socket } = useNuxtApp()
const client = useStrapiClient()
const { parse: parseMarkdown, stringify: stringifyMarkdown } = useMarkdown()
const { parse: parseJSON, stringify: stringifyJSON } = useJSON()
const { parse: parseYAML, stringify: stringifyYAML } = useYAML()
const { branch } = useProjectBranches(project.value)
const { components } = useProjectComponents(project.value)
const { draft, file, fetchFile, openCreateModal: openCreateFileModal, computedFiles } = useProjectFiles(project.value, root.value)
const { query: treeQuery, tree, openDir } = useProjectFilesTree(project.value, root.value)
const { scroll: editorScroll } = useEditorScroll(file)

const content: Ref<string> = ref('')
const parsedContent: Ref<Content | null> = ref(null)

// Methods

function parse (path, content: string): Partial<Content> {
  const ext = getPathExt(path)

  switch (ext) {
    case 'md': {
      const parsed = parseMarkdown(content)
      return {
        key: `project-${project.value.id}-${branch.value.name}-${path}`,
        markdown: parsed.content,
        matter: parsed.matter
      }
    }
    case 'json': {
      return {
        matter: parseJSON(content)
      }
    }
    case 'yml': {
      return {
        matter: parseYAML(content)
      }
    }
  }
}

function stringify (path, content: Ref<Partial<Content>>) {
  const ext = getPathExt(path)
  const { markdown, matter } = unref(content)

  switch (ext) {
    case 'md': return stringifyMarkdown(markdown, matter)
    case 'json': return stringifyJSON(matter)
    case 'yml': return stringifyYAML(matter)
  }
}

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
  const formattedContent = stringify(file.value.path, parsedContent)
  if (formattedContent === content.value) {
    return
  }

  try {
    const data = await client<GitHubDraft>(`/projects/${project.value.id}/files/${encodeURIComponent(file.value.path)}`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name,
        root: root.value
      },
      body: {
        content: formattedContent
      }
    })

    content.value = formattedContent
    draft.value = data

    $socket.emit('draft:update', `project-${project.value.id}:${branch.value.name}:${root.value}`)
  } catch (e) {}
}, 200)

// Watch

watch(file, async (file) => {
  if (!file) {
    return
  }

  // Open dirs in tree to match selected file
  openDirs()

  // Fetch content
  const { content: fetchedContent } = await fetchFile(file.path)
  content.value = fetchedContent

  parsedContent.value = parse(file.path, fetchedContent) as Content
}, { immediate: true })

// Hooks

onMounted(() => file.value && $socket.emit('file:join', `project-${project.value.id}:${branch.value.name}:${file.value.path}`))
onUnmounted(() => $socket.emit('file:leave', `project-${project.value.id}`))
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
