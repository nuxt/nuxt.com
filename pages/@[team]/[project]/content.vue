<template>
  <ProjectPage>
    <template #aside>
      <ProjectContentFilesTree :tree="tree" />
    </template>

    <template #header>
      <ProjectHeader>
        <template #extra-actions>
          <UButton size="xs" label="Create file" variant="secondary" icon="heroicons-outline:plus" @click="openCreateFileModal('content')" />
        </template>
      </ProjectHeader>
    </template>

    <div class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <div class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <DocusEditor v-if="file" :model-value="parsedContent" :theme="theme" class="flex flex-col flex-1" @update:model-value="updateContent" />
      </div>

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
const { draft, file, openCreateModal: openCreateFileModal } = useProjectFiles(props.project, root)
const { tree, openDir } = useProjectFilesTree(props.project, root)

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

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    params: {
      ref: branch.value?.name,
      root
    }
  })

  content.value = fetchedContent
}

async function updateFile (formattedContent) {
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

  content.value = formattedContent
  draft.value = data
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
