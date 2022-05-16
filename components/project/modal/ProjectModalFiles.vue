<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <ProjectCombobox
      :items="currentFiles"
      items-label="Files"
      :recent-items="recentFiles"
      :actions="actions"
      @select="onSelect"
    />
  </UModal>
</template>

<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { getPathName } from '~/utils/tree'
import type { GitHubFile, Project } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const project: Project = inject('project')

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const keys = useMagicKeys()
const {
  file: contentFile,
  computedFiles: contentFiles,
  recentFiles: contentRecentFiles,
  select: selectContentFile,
  refresh: refreshContentFiles,
  openCreateModal: openCreateContentFileModal,
  openRenameModal: openRenameContentFileModal,
  openDeleteModal: openDeleteContentFileModal,
  openRevertModal: openRevertContentFileModal
} = useProjectFiles(project, 'content')
const {
  file: mediaFile,
  computedFiles: mediaFiles,
  recentFiles: mediaRecentFiles,
  select: selectMediaFile,
  refresh: refreshMediaFiles,
  openUploadModal,
  openRenameModal: openRenameMediaFileModal,
  openDeleteModal: openDeleteMediaFileModal,
  openRevertModal: openRevertMediaFileModal
} = useProjectFiles(project, 'public')

const refreshingFiles = ref(false)

// Computed

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const isContentPage = computed(() => route.name === '@team-project-content')
const isMediaPage = computed(() => route.name === '@team-project-media')
const isDisabled = f => f.status === 'deleted' || (isContentPage.value && contentFile.value?.path === f.path) || (isMediaPage.value && mediaFile.value?.path === f.path)

const currentFiles = computed(() => {
  let currentFiles = []

  if (isMediaPage.value) {
    currentFiles = [
      ...mediaFiles.value,
      ...contentFiles.value
    ]
  } else {
    currentFiles = [
      ...contentFiles.value,
      ...mediaFiles.value
    ]
  }

  return currentFiles.map(f => ({ ...f, name: getPathName(f.path), icon: getIconName(f), iconColor: getIconColor(f), disabled: isDisabled(f) }))
})

const recentFiles = computed(() => {
  return [...contentRecentFiles.value, ...mediaRecentFiles.value]
    .filter(rf => currentFiles.value.find(f => f.path === rf.path))
    .filter((rf) => {
      if (isContentPage.value && contentFile.value && rf.path === contentFile.value.path) {
        return false
      }
      if (isMediaPage.value && mediaFile.value && rf.path === mediaFile.value.path) {
        return false
      }
      return true
    })
    .sort((a, b) => b.openedAt - a.openedAt)
    .map(rf => ({ ...rf, name: getPathName(rf.path), icon: getIconName(rf), iconColor: getIconColor(rf), disabled: isDisabled(rf) }))
    .slice(0, 5)
})

const actions = computed(() => ([{
  key: 'refresh',
  label: 'Refresh files',
  icon: 'heroicons-outline:refresh',
  iconClass: refreshingFiles.value ? 'animate-spin' : '',
  click: refreshFiles,
  prevent: true
}, {
  key: 'create',
  label: 'Create file',
  icon: 'heroicons-outline:plus',
  visible: isContentPage.value,
  click: onCreateFile
}, {
  key: 'upload',
  label: 'Upload file',
  icon: 'heroicons-outline:plus',
  visible: isMediaPage.value,
  click: onUploadFile
}, {
  key: 'rename',
  label: 'Rename file',
  icon: 'heroicons-outline:pencil',
  visible: (isContentPage.value && contentFile.value) || (isMediaPage.value && mediaFile.value),
  click: onRenameFile
}, {
  key: 'delete',
  label: 'Delete file',
  icon: 'heroicons-outline:trash',
  visible: (isContentPage.value && contentFile.value && !['deleted'].includes(contentFile.value.status)) || (isMediaPage.value && mediaFile.value && !['deleted'].includes(mediaFile.value.status)),
  click: onDeleteFile
}, {
  key: 'revert',
  label: 'Revert file',
  icon: 'heroicons-outline:reply',
  visible: (isContentPage.value && !!contentFile.value?.status) || (isMediaPage.value && !!mediaFile.value?.status),
  click: onRevertFile
}]))

// Watch

whenever(keys.meta_k, () => {
  isOpen.value = !isOpen.value
})

// Methods

function getIconName (file) {
  switch (file.status) {
    case 'created':
      return 'heroicons-outline:document-add'
    case 'updated':
      return 'heroicons-outline:document-text'
    case 'deleted':
      return 'heroicons-outline:document-remove'
    case 'renamed':
      return 'heroicons-outline:document-text'
    default:
      return 'heroicons-outline:document-text'
  }
}

function getIconColor (file) {
  switch (file.status) {
    case 'created':
      return 'text-green-500'
    case 'updated':
      return 'text-yellow-500'
    case 'deleted':
      return 'text-red-500'
    case 'renamed':
      return 'text-blue-500'
  }
}

function onFileSelect (f: GitHubFile) {
  if (f.path.startsWith('public/')) {
    router.push({ name: '@team-project-media' })
    selectMediaFile(f)
  } else if (f.path.startsWith('content/')) {
    router.push({ name: '@team-project-content' })
    selectContentFile(f)
  }
}

function onSelect (option, data) {
  if (!option.prevent) {
    isOpen.value = false
  }

  if (option.click) {
    option.click(data)
  } else {
    onFileSelect(option)
  }
}

function onCreateFile () {
  openCreateContentFileModal('content')
}

function onUploadFile () {
  openUploadModal()
}

function onRenameFile () {
  if (isContentPage.value) {
    openRenameContentFileModal(contentFile.value.path)
  } else if (isMediaPage.value) {
    openRenameMediaFileModal(mediaFile.value.path)
  }
}

function onDeleteFile () {
  if (isContentPage.value) {
    openDeleteContentFileModal(contentFile.value.path)
  } else if (isMediaPage.value) {
    openDeleteMediaFileModal(mediaFile.value.path)
  }
}

function onRevertFile () {
  if (isContentPage.value) {
    openRevertContentFileModal(contentFile.value.path)
  } else if (isMediaPage.value) {
    openRevertMediaFileModal(mediaFile.value.path)
  }
}

async function refreshFiles () {
  refreshingFiles.value = true

  await refreshContentFiles(true)
  await refreshMediaFiles(true)

  refreshingFiles.value = false
}
</script>
