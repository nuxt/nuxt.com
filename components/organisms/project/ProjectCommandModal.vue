<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
      <div class="relative">
        <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
        <ComboboxInput :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
      </div>

      <ComboboxOptions static class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
        <li class="p-2">
          <h2 class="px-3 my-2 text-xs font-semibold u-text-gray-900">
            Actions
          </h2>

          <ul class="text-sm u-text-gray-700">
            <ComboboxOption v-for="(a, index) in actions" :key="index" v-slot="{ active }" :value="a" as="template">
              <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
                <UIcon :name="a.icon" :class="['h-5 w-5 flex-none u-text-gray-400', active && 'u-text-gray-900', a.iconClass]" aria-hidden="true" />
                <span class="flex-auto ml-3 truncate">{{ a.label }}</span>
              </li>
            </ComboboxOption>
          </ul>
        </li>
        <li v-if="filteredBranches.length" class="p-2">
          <h2 class="px-3 my-2 text-xs font-semibold u-text-gray-900">
            Branches
          </h2>

          <ul class="text-sm u-text-gray-700">
            <ComboboxOption v-for="b of filteredBranches" :key="b.name" v-slot="{ active }" :value="b" as="template">
              <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
                <UIcon name="mdi:source-branch" :class="['h-5 w-5 flex-none u-text-gray-400', active && 'u-text-gray-900']" aria-hidden="true" />
                <span class="flex-auto ml-3 truncate">{{ b.name }}</span>
                <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
              </li>
            </ComboboxOption>
          </ul>
        </li>
        <li v-if="query && filteredFiles.length" class="p-2">
          <h2 class="px-3 my-2 text-xs font-semibold u-text-gray-900">
            Files
          </h2>

          <ul class="text-sm u-text-gray-700">
            <ComboboxOption v-for="f of filteredFiles" :key="f.path" v-slot="{ active }" :value="f" as="template">
              <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
                <UIcon :name="f.icon" :class="['h-5 w-5 flex-none', f.iconColor]" aria-hidden="true" />
                <p class="flex-auto ml-3 truncate u-text-gray-400">
                  <span class="u-text-gray-700">{{ f.name }}</span>
                  <span class="ml-1 text-xs italic truncate">{{ f.path }}</span>
                </p>
                <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
              </li>
            </ComboboxOption>
          </ul>
        </li>
      </ComboboxOptions>
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
import type { GitHubBranch, GitHubFile, Project } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const project: Project = inject('project')
const root: string = inject('root')

const emit = defineEmits(['update:modelValue'])

const keys = useMagicKeys()
const { branches, branch, pending: pendingBranches, refresh: refreshBranches, select: selectBranch, openCreateModal: openCreateBranchModal } = useProjectBranches(project)
const { computedFiles, select: selectFile } = useProjectFiles(project, root)

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

const query = ref('')
const branchExists = computed(() => query.value && branches.value.some(b => b.name === query.value))
const filteredBranches = computed(() => {
  let filteredBranches = [...branches.value]
  if (query.value) {
    filteredBranches = filteredBranches.filter(b => b.name.search(new RegExp(query.value, 'i')) !== -1)
  }
  filteredBranches = filteredBranches.filter(b => b.name !== branch.value.name)
  return filteredBranches
})
const filteredFiles = computed(() => {
  if (!query.value) {
    return []
  }

  const filteredFiles = [...computedFiles.value]
    .filter(f => f.path.search(new RegExp(query.value, 'i')) !== -1)
    .map(f => ({ ...f, name: getPathName(f.path), icon: getIconName(f), iconColor: getIconColor(f) }))
  return filteredFiles
})
const actions = computed(() => ([
  { label: `Create new branch ${query.value && !branchExists.value ? `"${query.value}"` : ''}`, icon: 'heroicons-outline:plus', click: onCreateBranchClick },
  !query.value && { label: 'Refresh branches', icon: 'heroicons-outline:refresh', iconClass: pendingBranches.value ? 'animate-spin' : '', click: refreshBranches }
].filter(Boolean)))

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

function onBranchSelect (b: GitHubBranch) {
  selectBranch(b)
  isOpen.value = false
  query.value = ''
}

function onFileSelect (f: GitHubFile) {
  selectFile(f)
  isOpen.value = false
  query.value = ''
}

function onCreateBranchClick () {
  openCreateBranchModal(!branchExists.value ? query.value : '', false)
  isOpen.value = false
  query.value = ''
}

function onSelect (option) {
  if (option.click) {
    option.click()
  } else if (option.path) {
    onFileSelect(option)
  } else {
    onBranchSelect(option)
  }
}
</script>
