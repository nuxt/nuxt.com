<template>
  <ProjectPage title="Content">
    <template #aside>
      <ProjectContentFilesTree :tree="tree" />
    </template>

    <template #aside-header>
      <UButton
        size="xxs"
        class="-my-0.5 -mr-1"
        variant="transparent-hover"
        icon="heroicons-outline:plus"
        @click="openCreateFileModal('content')"
      />
    </template>

    <template #header>
      <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
        <div class="flex items-center min-w-0 gap-3">
          <UButton
            v-if="branch"
            icon="mdi:source-branch"
            :label="branch.name"
            variant="secondary"
            size="xs"
            truncate
            @click="modal = true"
          />

          <p v-if="file" class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-500">
            <span class="truncate">{{ file.path }}</span>
            <UButton
              icon="heroicons-outline:external-link"
              target="_blank"
              :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${file.path}`"
              variant="transparent"
              size="xxs"
              class="!p-0"
            />
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            v-if="isDraft"
            label="Save"
            :loading="loading"
            size="sm"
            icon="heroicons-outline:check"
            trailing
            @click="commit"
          />
          <UButton
            v-else-if="branch.name !== project.repository.default_branch"
            label="Publish"
            :loading="loading"
            size="sm"
            icon="heroicons-outline:cloud-upload"
            trailing
            @click="openPublishModal"
          />
        </div>
      </div>
    </template>

    <div class="flex items-stretch flex-1 min-h-0">
      <div class="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <DocusEditor :model-value="parsedContent" :theme="theme" class="flex flex-col flex-1" @update:model-value="updateContent" />
      </div>

      <ProjectContentFileAside :model-value="parsedMatter" @update:model-value="updateMatter" />
    </div>

    <ProjectCommandModal v-model="modal" />

    <div ref="modalContainer" />
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
const { container: modalContainer } = useModal()
const { branch } = useProjectBranches(props.project)
const { draft, isDraft, file, fetch: fetchFiles, refresh: refreshFiles, commit, loading, openCreateModal: openCreateFileModal, openPublishModal } = useProjectFiles(props.project, root)
const { tree, openDir } = useProjectFilesTree(props.project, root)

const modal = ref(false)
const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<object> = ref({})

// Data

await fetchFiles()

// Watch

// Fetch content when file changes
watch(file, () => fetchContent(), { immediate: true })

// Fetch files when branch changes
watch(branch, () => refreshFiles())

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
      ref: branch.value?.name
    }
  })

  content.value = fetchedContent
}

async function updateFile (formattedContent) {
  const data = await client<GitHubDraft>(`/projects/${props.project.id}/files/${encodeURIComponent(file.value.path)}`, {
    method: 'PUT',
    params: {
      ref: branch.value?.name
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
