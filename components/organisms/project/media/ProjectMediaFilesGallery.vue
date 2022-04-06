<template>
  <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 xl:gap-x-8">
    <li v-for="file in computedFiles" :ref="(el) => { mediaRefs[file.path] = el }" :key="file.path" class="relative" @click="selectFile(file)">
      <div :class="[isSelected(file) ? 'ring-2 ring-offset-2 u-ring-gray-900 ring-offset-gray-50 dark:ring-offset-gray-900' : 'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 dark:focus-within:ring-offset-gray-800 focus-within:u-ring-gray-900', 'group block w-full aspect-w-10 aspect-h-7 rounded-lg u-bg-gray-100 overflow-hidden']">
        <img v-if="mediaData[file.path]" :src="`data:${mediaData[file.path].mimeType};base64,${mediaData[file.path].content}`" alt="" :class="[isSelected(file) ? '' : 'group-hover:opacity-75', 'object-scale-down object-center pointer-events-none']">
        <button v-if="!isDeleted(file)" type="button" class="absolute inset-0 focus:outline-none">
          <span class="sr-only">View details for {{ file.name }}</span>
        </button>
      </div>
      <div class="flex items-center mt-2 gap-2">
        <div class="flex flex-col flex-1 truncate">
          <div class="flex items-center">
            <span class="text-sm font-medium u-text-gray-900 truncate pointer-events-none" :class="{ 'line-through opacity-50': isDeleted(file) }">
              <span>{{ file.name }}</span>
            </span>
            <ProjectMediaFilesGalleryBadge :file="file" class="flex-shrink-0" />
          </div>
          <span class="block text-sm italic u-text-gray-400 pointer-events-none truncate">
            {{ file.path }}
          </span>
        </div>
        <div class="flex-shrink-0">
          <UDropdown
            placement="bottom-end"
            class="-mr-1.5"
            :items="dropdownItems(file)"
          >
            <UButton icon="heroicons-outline:dots-vertical" variant="transparent" class="!p-0" />
          </UDropdown>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import type { GitHubFile, Project, Root } from '~/types'

const project: Project = inject('project')
const root: Root = inject('root')

const { file: selectedFile, computedFiles, select, fetchFile, openRenameModal, openRevertModal, openDeleteModal } = useProjectFiles(project, root)

const isSelected = (file: GitHubFile) => selectedFile.value && file.path === selectedFile.value.path
const isDeleted = (file: GitHubFile) => file.status === 'deleted'

const dropdownItems = (file: GitHubFile) => {
  return [
    [
      file?.status !== 'deleted' && {
        label: 'Rename file',
        icon: 'heroicons-outline:pencil',
        click: () => {
          openRenameModal(file.path, 'public')
        }
      },
      !!file.status && {
        label: 'Revert file',
        icon: 'heroicons-outline:reply',
        click: () => {
          openRevertModal(file.path)
        }
      },
      file?.status !== 'deleted' && {
        label: 'Delete file',
        icon: 'heroicons-outline:trash',
        click: () => {
          openDeleteModal(file.path)
        }
      }
    ].filter(Boolean)
  ]
}

const mediaRefs = ref({})

const mediaData = useState('media-data', () => ({}))

onMounted(() => {
  for (const [path, el] of Object.entries(mediaRefs.value)) {
    useIntersectionObserver(el as HTMLElement, async ([{ isIntersecting }], _) => {
      const file = computedFiles.value.find(file => file.path === path)
      const realPath = file.oldPath || file.path
      const requestContent = !mediaData.value[realPath]
      if (isIntersecting && requestContent) {
        mediaData.value[realPath] = await fetchFile(realPath)
      }
    })
  }
})

const selectFile = (file: GitHubFile) => {
  // Prevent click when clicking on selected file
  if (selectedFile.value && selectedFile.value.path === file.path) {
    return
  }

  if (isDeleted(file)) {
    return
  }

  select(file)
}
</script>
