<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
      <div class="relative">
        <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
        <ComboboxInput :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
      </div>

      <ComboboxOptions v-if="filteredFiles.length > 0" static class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
        <li class="p-2">
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
              </li>
            </ComboboxOption>
          </ul>
        </li>
      </ComboboxOptions>

      <div v-if="query !== '' && filteredFiles.length === 0" class="py-14 px-6 flex-1 flex flex-col items-center justify-center sm:px-14">
        <UIcon name="heroicons-outline:document-text" class="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
        <p class="mt-4 text-sm text-gray-900">
          We couldn't find any files with that term. Please try again.
        </p>
      </div>

      <div v-if="query === '' && filteredFiles.length === 0" class="py-14 px-6 flex-1 flex flex-col items-center justify-center sm:px-14">
        <UIcon name="heroicons-outline:document-text" class="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
        <p class="mt-4 text-sm text-gray-900">
          We couldn't find any files.
        </p>
      </div>
    </Combobox>
  </UModal>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
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
const { file: contentFile, computedFiles: contentFiles, select: selectContentFile } = useProjectFiles(project, 'content')
const { file: mediaFile, computedFiles: mediaFiles, select: selectMediaFile } = useProjectFiles(project, 'public')

const query = ref('')

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

const currentFiles = computed(() => {
  let currentFiles = []

  if (route.name === '@team-project-content') {
    let files = [...contentFiles.value]
    if (contentFile.value) {
      files = files.filter(f => f.path !== contentFile.value.path)
    }

    currentFiles = [
      ...files,
      ...mediaFiles.value
    ]
  } else if (route.name === '@team-project-media') {
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
</script>
