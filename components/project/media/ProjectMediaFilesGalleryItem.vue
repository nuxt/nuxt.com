<template>
  <li ref="item" :key="file.path" class="relative" @click="selectFile">
    <div :class="[isSelected ? 'ring-2 ring-offset-2 u-ring-gray-900 ring-offset-gray-50 dark:ring-offset-gray-900' : 'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 dark:focus-within:ring-offset-gray-800 focus-within:u-ring-gray-900', 'group block w-full aspect-w-10 aspect-h-7 rounded-lg u-bg-gray-100 overflow-hidden']">
      <img v-if="medias[file.path]" :src="`data:${medias[file.path].mimeType};base64,${medias[file.path].content}`" alt="" :class="[isSelected ? '' : 'group-hover:opacity-75', 'object-scale-down object-center pointer-events-none']">
      <button v-if="!isDeleted" type="button" class="absolute inset-0 focus:outline-none">
        <span class="sr-only">View details for {{ file.name }}</span>
      </button>
    </div>
    <div class="flex items-center mt-2 gap-2">
      <div class="flex flex-col flex-1 truncate">
        <div class="flex items-center">
          <span class="text-sm font-medium u-text-gray-900 truncate pointer-events-none" :class="{ 'line-through opacity-50': isDeleted }">
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
          :items="dropdownItems"
        >
          <UButton icon="heroicons-outline:dots-vertical" variant="transparent" class="!p-0" />
        </UDropdown>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import type { GitHubFile, Project, Root } from '~/types'

const props = defineProps({
  medias: {
    type: Object,
    default: () => ({})
  },
  file: {
    type: Object as PropType<GitHubFile>,
    required: true
  }
})

const emit = defineEmits(['fileVisible'])

const project: Project = inject('project')
const root: Root = inject('root')

const { file: selectedFile, select, openRenameModal, openRevertModal, openDeleteModal } = useProjectFiles(project, root)

const item = ref(null)

const isSelected = computed(() => props.file.path === selectedFile.value)
const isDeleted = computed(() => props.file.status === 'deleted')

const dropdownItems = computed(() => {
  return [
    [
      props.file?.status !== 'deleted' && {
        label: 'Rename file',
        icon: 'heroicons-outline:pencil',
        click: () => {
          openRenameModal(props.file.path, 'public')
        }
      },
      !!props.file.status && {
        label: 'Revert file',
        icon: 'heroicons-outline:reply',
        click: () => {
          openRevertModal(props.file.path)
        }
      },
      props.file?.status !== 'deleted' && {
        label: 'Delete file',
        icon: 'heroicons-outline:trash',
        click: () => {
          openDeleteModal(props.file.path)
        }
      }
    ].filter(Boolean)
  ]
})

onMounted(() => {
  useIntersectionObserver(item, ([{ isIntersecting }], _) => {
    if (isIntersecting && !props.medias[props.file.path]) {
      emit('fileVisible', props.file.path)
    }
  })
})

const selectFile = () => {
  // Prevent click when clicking on selected file
  if (selectedFile.value === props.file.path) {
    return
  }

  if (isDeleted.value) {
    return
  }

  select(props.file.path)
}
</script>
