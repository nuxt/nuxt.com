<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
      <div class="relative">
        <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
        <ComboboxInput ref="comboboxInput" :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
      </div>

      <ComboboxOptions static hold class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
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
        <li class="p-2">
          <ul class="text-sm u-text-gray-700">
            <ComboboxOption v-for="a in actions" :key="a.key" v-slot="{ active }" :value="a" as="template">
              <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
                <UIcon :name="a.icon" :class="['h-5 w-5 flex-none u-text-gray-400', active && 'u-text-gray-900', a.iconClass]" aria-hidden="true" />
                <span class="flex-auto ml-3 truncate">{{ a.label }}</span>
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
import type { GitHubBranch, Project } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const project: Project = inject('project')

const emit = defineEmits(['update:modelValue'])

const keys = useMagicKeys()
const {
  isDraft: isDraftContent,
  draft: contentDraft,
  file: contentFile,
  init: selectNewContentFile,
  refresh: refreshContentFiles
} = useProjectFiles(project, 'content')
const {
  isDraft: isDraftMedia,
  draft: publicDraft,
  file: publicFile,
  init: selectNewPublicFile,
  refresh: refreshMediaFiles
} = useProjectFiles(project, 'public')
const {
  branches,
  branch,
  pending: pendingBranches,
  refresh: refreshBranches,
  reset: resetDraft,
  select: selectBranch,
  openCreateModal: openCreateBranchModal
} = useProjectBranches(project)

const query = ref('')

whenever(keys.meta_b, () => {
  isOpen.value = !isOpen.value
})

// Computed

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})
const branchExists = computed(() => query.value && branches.value.some(b => b.name === query.value))
const filteredBranches = computed(() => {
  let filteredBranches = [...branches.value]
  if (query.value) {
    filteredBranches = filteredBranches.filter(b => b.name.search(new RegExp(query.value, 'i')) !== -1)
  }
  filteredBranches = filteredBranches.filter(b => b.name !== branch.value.name)
  return filteredBranches
})
const actions = computed(() => ([
  { key: 'create', label: `Create new branch ${query.value && !branchExists.value ? `"${query.value}"` : ''}`, icon: 'heroicons-outline:plus', click: onCreateBranchClick },
  !query.value && { key: 'refresh', label: 'Refresh branches', icon: 'heroicons-outline:refresh', iconClass: pendingBranches.value ? 'animate-spin' : '', click: refreshBranches },
  !query.value && (isDraftContent.value || isDraftMedia.value) && { key: 'reset', label: 'Revert draft', icon: 'heroicons-outline:reply', click: onResetDraftClick }
].filter(Boolean)))

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

// Methods

function activateFirstOption () {
  // hack combobox by using keyboard event
  // https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-vue/src/components/combobox/combobox.ts#L692
  setTimeout(() => {
    comboboxInput.value?.$el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }))
  }, 0)
}

function onBranchSelect (b: GitHubBranch) {
  isOpen.value = false
  selectBranch(b)
  refreshMediaFiles()
  refreshContentFiles()
  query.value = ''
}

function onCreateBranchClick () {
  isOpen.value = false
  setTimeout(() => {
    openCreateBranchModal(!branchExists.value ? query.value : '', false)
    query.value = ''
  }, 0)
}

async function onResetDraftClick () {
  try {
    await resetDraft()

    contentDraft.value = null
    publicDraft.value = null

    // Select new file if the current file no longer exists
    if (['renamed', 'created', 'updated'].includes(contentFile.value?.status)) {
      selectNewContentFile()
    }
    if (['renamed', 'created'].includes(publicFile.value?.status)) {
      selectNewPublicFile()
    }

    isOpen.value = false
  } catch {}
}

function onSelect (option) {
  if (option.click) {
    option.click()
  } else {
    onBranchSelect(option)
  }
}
</script>
