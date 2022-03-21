<template>
  <ProjectPage title="Content">
    <template #aside>
      <ProjectContentFilesTree
        :project="project"
        :tree="tree"
        :opened-dirs="openedDirs"
        @openDir="openDir"
        @dropFile="dropFile"
      />
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

      <ProjectContentFileAside v-if="file" v-model="parsedMatter" :file="file" :project="project" :branch="branch" />
    </div>

    <ProjectCommandModal v-model="modal" :project="project" :root="root" />

    <div ref="modalContainer" />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { debounce } from 'lodash-es'
import { mapTree, findTree, renamePath, getPathDir } from '~/utils/tree'
import type { Team, Project, GitHubDraft, GitHubFile } from '~/types'

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

const root: string = 'content'
const colorMode = useColorMode()
const client = useStrapiClient()
const { parseFrontMatter, stringifyFrontMatter } = useMarkdown()
const { branch } = useProjectBranches(props.project)
const { draft, computedFiles, isDraft, file, bulkRename: bulkRenameFiles, fetch: fetchFiles, commit, loading, openCreateModal: openCreateFileModal, openPublishModal } = useProjectFiles(props.project, 'content')
const { container: modalContainer } = useModal()

const content: Ref<string> = ref('')
const parsedContent: Ref<string> = ref('')
const parsedMatter: Ref<object> = ref({})
const modal = ref(false)
const openedDirs = ref({})

// Data

await fetchFiles()

// Watch

// Fetch content when file changes
watch(file, async () => await fetchContent(), { immediate: true })

watch(() => file.value.path, (path) => {
  const paths = path.split('/')
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

const tree = computed(() => {
  const files = [...computedFiles.value]
  files.sort((a, b) => a.path.localeCompare(b.path, undefined, {
    numeric: true,
    sensitivity: 'base'
  }))

  return mapTree(files)
})

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')

// Methods

function openDir (path: string, value?: boolean) {
  openedDirs.value[path] = value !== undefined ? value : !openedDirs.value[path]
}

function dropFile (src: GitHubFile, dst: GitHubFile, position: 'above' | 'below' | 'over') {
  const filesToRename = []
  // Find files parents
  const srcDir = getPathDir(src.path)
  const dstDir = getPathDir(dst.path)
  // Find files tree
  const srcTree = findTree(src.path, tree.value)
  const dstTree = findTree(dst.path, tree.value)
  // Find files indexes in respective tree
  const srcIndex = srcTree.filter(f => f.type !== 'directory').findIndex(f => f.path === src.path)
  const dstIndex = dstTree.filter(f => f.type !== 'directory').findIndex(f => f.path === dst.path)
  // Src and dst index are the same
  const sameTree = srcDir === dstDir
  // Increment index only if src file is below / above current file or tree is different
  let index = dstIndex === -1 ? 0 : dstIndex
  if (sameTree) {
    if (position === 'below' && srcIndex > dstIndex) {
      index += 1
    } else if (position === 'above' && dstIndex > srcIndex) {
      index -= 1
    }
  } else if (position === 'below') {
    index += 1
  }

  filesToRename.push({ oldPath: src.path, newPath: renamePath(src.path, dst.path, index + 1) })

  if (sameTree) {
    if (srcIndex > dstIndex) {
      // I move a file up
      for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < srcIndex; i++) {
        filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i + 2) })
      }
    } else {
      // I move a file down
      for (let i = position === 'above' ? (dstIndex - 1) : dstIndex; i > srcIndex; i--) {
        filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
      }
    }
  } else {
    // Rename `srcTree` files after `srcIndex`
    for (let i = srcIndex + 1; i < srcTree.length; i++) {
      filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
    }
    // Rename `dstTree` files after `dstIndex`
    for (let i = position === 'below' ? (dstIndex + 1) : dstIndex; i < dstTree.length; i++) {
      filesToRename.push({ oldPath: dstTree[i].path, newPath: renamePath(dstTree[i].path, dstTree[i].path, i + 2) })
    }
  }

  bulkRenameFiles(filesToRename.filter(f => f.oldPath !== f.newPath))
}

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

const updateContent = debounce(async (newContent: string) => {
  if (!file.value) {
    return
  }

  const formattedContent = stringifyFrontMatter(newContent, parsedMatter.value)

  if (formattedContent === content.value) {
    return
  }

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
