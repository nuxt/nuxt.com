<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
      <div class="relative">
        <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
        <ComboboxInput ref="comboboxInput" :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
      </div>

      <ComboboxOptions v-if="filteredFiles.length > 0 || (recentFiles.length > 0 && !query) || filteredActions.length" static hold class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
        <li v-if="recentFiles.length && !query" class="p-2">
          <h2 class="px-3 my-2 text-xs font-semibold u-text-gray-900">
            Recent
          </h2>

          <ul class="text-sm u-text-gray-700">
            <ComboboxOption
              v-for="f of recentFiles"
              :key="f.path"
              v-slot="{ active }"
              :value="f"
              :disabled="f.status === 'deleted'"
              as="template"
            >
              <li :class="['flex select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900', f.status === 'deleted' ? 'cursor-not-allowed' : 'cursor-pointer']">
                <UIcon :name="f.icon" :class="['h-5 w-5 flex-none', f.iconColor]" aria-hidden="true" />
                <p class="flex-auto ml-3 truncate u-text-gray-400" :class="{ 'line-through opacity-50': f.status === 'deleted' }">
                  <span class="u-text-gray-700">{{ f.name }}</span>
                  <span class="ml-1 text-xs italic truncate">{{ f.path }}</span>
                </p>
                <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
                <UAvatarGroup v-else :group="usersGroup(f)" size="xxs" />
              </li>
            </ComboboxOption>
          </ul>
        </li>

        <li v-if="filteredFiles.length" class="p-2">
          <h2 class="px-3 my-2 text-xs font-semibold u-text-gray-900">
            Files
          </h2>

          <ul class="text-sm u-text-gray-700">
            <ComboboxOption
              v-for="f of filteredFiles"
              :key="f.path"
              v-slot="{ active }"
              :value="f"
              :disabled="f.status === 'deleted'"
              as="template"
            >
              <li :class="['flex select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900', f.status === 'deleted' ? 'cursor-not-allowed' : 'cursor-pointer']">
                <UIcon :name="f.icon" :class="['h-5 w-5 flex-none', f.iconColor]" aria-hidden="true" />
                <p class="flex-auto ml-3 truncate u-text-gray-400" :class="{ 'line-through opacity-50': f.status === 'deleted' }">
                  <span class="u-text-gray-700">{{ f.name }}</span>
                  <span class="ml-1 text-xs italic truncate">{{ f.path }}</span>
                </p>
                <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
                <UAvatarGroup v-else :group="usersGroup(f)" size="xxs" />
              </li>
            </ComboboxOption>
          </ul>
        </li>

        <li v-if="filteredActions.length" class="p-2">
          <ul class="text-sm u-text-gray-700">
            <ComboboxOption v-for="a in filteredActions" :key="a.key" v-slot="{ active }" :value="a" as="template">
              <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
                <UIcon :name="a.icon" :class="['h-5 w-5 flex-none u-text-gray-400', active && 'u-text-gray-900', a.iconClass]" aria-hidden="true" />
                <span class="flex-auto ml-3 truncate">{{ a.label }}</span>
              </li>
            </ComboboxOption>
          </ul>
        </li>
      </ComboboxOptions>

      <div v-if="filteredFiles.length === 0 && filteredActions.length === 0" class="py-14 px-6 flex-1 flex flex-col items-center justify-center sm:px-14">
        <UIcon name="heroicons-outline:document-text" class="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
        <p class="mt-4 text-sm text-gray-900">
          {{ query ? "We couldn't find any files with that term. Please try again." : "We couldn't find any files." }}
        </p>
      </div>
    </Combobox>
  </UModal>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { getPathName } from '~/utils/tree'
import type { GitHubFile, Project, SocketUser } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const project: Project = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const keys = useMagicKeys()
const { branch } = useProjectBranches(project)
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

const query = ref('')
const refreshingFiles = ref(false)

whenever(keys.meta_k, () => {
  isOpen.value = !isOpen.value
})

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const isContentPage = computed(() => route.name === '@team-project-content')
const isMediaPage = computed(() => route.name === '@team-project-media')

const comboboxInput = ref(null)

watch(() => query.value, (value, oldValue) => {
  if (value !== oldValue) {
    activateFirstOption()
  }
})

watch(() => isOpen.value, (value) => {
  if (value) {
    activateFirstOption()
  }
})

function activateFirstOption () {
  // hack combobox by using keyboard event
  // https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-vue/src/components/combobox/combobox.ts#L692
  setTimeout(() => {
    comboboxInput.value?.$el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }))
  }, 0)
}

const currentFiles = computed(() => {
  let currentFiles = []

  if (isContentPage.value) {
    let files = [...contentFiles.value]
    if (contentFile.value) {
      files = files.filter(f => f.path !== contentFile.value.path)
    }

    currentFiles = [
      ...files,
      ...mediaFiles.value
    ]
  } else if (isMediaPage.value) {
    let files = [...mediaFiles.value]
    if (mediaFile.value) {
      files = files.filter(f => f.path !== mediaFile.value.path)
    }

    currentFiles = [
      ...files,
      ...contentFiles.value
    ]
  } else {
    currentFiles = [
      ...contentFiles.value,
      ...mediaFiles.value
    ]
  }

  return currentFiles.map(f => ({ ...f, name: getPathName(f.path), icon: getIconName(f), iconColor: getIconColor(f) }))
})

const filteredFiles = computed(() => {
  let filteredFiles = [...currentFiles.value]

  if (query.value) {
    filteredFiles = filteredFiles.filter(f => f.path.search(new RegExp(query.value, 'i')) !== -1)
  }
  filteredFiles = filteredFiles.slice(0, 24)
  return filteredFiles
})

const recentFiles = computed(() => {
  let recentFiles = [
    ...contentRecentFiles.value,
    ...mediaRecentFiles.value
  ].sort((a, b) => b.openedAt - a.openedAt)

  if (isContentPage.value) {
    if (contentFile.value) {
      recentFiles = recentFiles.filter(f => f.path !== contentFile.value.path)
    }
  } else if (isMediaPage.value) {
    if (mediaFile.value) {
      recentFiles = recentFiles.filter(f => f.path !== mediaFile.value.path)
    }
  }

  return recentFiles
    .map(f => ({ ...f, name: getPathName(f.path), icon: getIconName(f), iconColor: getIconColor(f) }))
    .slice(0, 5)
})

const actions = computed(() => ([{
  key: 'refresh',
  label: 'Refresh files',
  icon: 'heroicons-outline:refresh',
  iconClass: refreshingFiles.value ? 'animate-spin' : '',
  click: refreshFiles
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

const filteredActions = computed(() => [...actions.value].filter((a) => {
  return (a.visible === undefined || a.visible) && (!query.value || [a.key, a.label].filter(Boolean).some(value => value.search(new RegExp(query.value, 'i')) !== -1))
}))

// Methods

function usersGroup (f: GitHubFile) {
  return activeUsers.value.reduce((acc, user) => {
    if (user.branch === branch.value?.name && user.file === f.path) {
      acc.push({ src: user.avatar, alt: user.username })
    }
    return acc
  }, [])
}

const getIconName = (file) => {
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

const getIconColor = (file) => {
  switch (file.status) {
    case 'created':
      return 'text-green-500'
    case 'updated':
      return 'text-amber-500'
    case 'deleted':
      return 'text-red-500'
    case 'renamed':
      return 'text-blue-500'
  }
}

function onFileSelect (f: GitHubFile) {
  isOpen.value = false
  if (f.path.startsWith('public/')) {
    router.push({ name: '@team-project-media' })
    selectMediaFile(f)
  } else if (f.path.startsWith('content/')) {
    router.push({ name: '@team-project-content' })
    selectContentFile(f)
  }
  query.value = ''
}

function onSelect (option) {
  if (option.click) {
    option.click()
  } else {
    onFileSelect(option)
  }
}

function onCreateFile () {
  isOpen.value = false
  openCreateContentFileModal('content')
}

function onUploadFile () {
  isOpen.value = false
  openUploadModal()
}

function onRenameFile () {
  isOpen.value = false
  if (isContentPage.value) {
    openRenameContentFileModal(contentFile.value.path)
  } else if (isMediaPage.value) {
    openRenameMediaFileModal(mediaFile.value.path)
  }
}

function onDeleteFile () {
  isOpen.value = false
  if (isContentPage.value) {
    openDeleteContentFileModal(contentFile.value.path)
  } else if (isMediaPage.value) {
    openDeleteMediaFileModal(mediaFile.value.path)
  }
}

function onRevertFile () {
  isOpen.value = false
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
