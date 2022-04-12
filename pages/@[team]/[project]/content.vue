<template>
  <ProjectPage>
    <template v-if="computedFiles.length" #aside>
      <div class="flex flex-col flex-1 overflow-y-hidden">
        <ProjectContentFilesTree :tree="tree" class="flex-1 overflow-y-auto" />
        <div class="flex flex-shrink-0 p-2 border-t u-border-gray-300">
          <UInput v-model="treeQuery" autocomplete="off" placeholder="Filter files" class="flex w-full" custom-class="truncate pr-9">
            <UButton v-if="treeQuery" icon="heroicons-outline:x" variant="transparent" class="absolute right-0" @click="treeQuery = ''" />
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
        <DocusEditor v-if="file" :model-value="parsedContent" :theme="theme" class="flex flex-col flex-1" @update:model-value="updateContent" />
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

const root = 'content'

provide('project', props.project)
provide('root', root)

const colorMode = useColorMode()
const client = useStrapiClient()
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()
const { branch } = useProjectBranches(props.project)
const { draft, file, fetchFile, openCreateModal: openCreateFileModal, computedFiles } = useProjectFiles(props.project, root)
const { query: treeQuery, tree, openDir } = useProjectFilesTree(props.project, root)

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

// Computed

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')

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
    const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name,
        root
      },
      body: {
        content: formattedContent
      }
    })

    file.value.status = 'updated'
    content.value = formattedContent
    draft.value = data
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
