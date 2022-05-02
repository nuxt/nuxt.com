<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col overflow-hidden h-80">
    <ProjectCombobox
      :items="currentBranches"
      items-label="Branches"
      :recent-items="recentItems"
      :actions="actions"
      @select="onSelect"
    />
  </UModal>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever, and, useActiveElement } from '@vueuse/core'
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
const activeElement = useActiveElement()

const {
  isDraft: isDraftContent,
  draft: contentDraft,
  init: initContentFile,
  refresh: refreshContentFiles
} = useProjectFiles(project, 'content')
const {
  isDraft: isDraftMedia,
  draft: publicDraft,
  init: initPublicFile,
  refresh: refreshMediaFiles
} = useProjectFiles(project, 'public')
const {
  branch,
  branches,
  recentBranches,
  pending: pendingBranches,
  refresh: refreshBranches,
  reset: resetDraft,
  select: selectBranch,
  openCreateModal: openCreateBranchModal
} = useProjectBranches(project)

// Computed

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const currentBranches = computed(() => {
  return [...branches.value]
    .map(b => ({ ...b, icon: 'mdi:source-branch', disabled: b.name === branch.value }))
})

const recentItems = computed(() => {
  return [...recentBranches.value]
    .filter(rb => branches.value.find(b => b.name === rb.name))
    .filter(rb => rb.name !== branch.value)
    .sort((a, b) => b.openedAt - a.openedAt)
    .map(b => ({ ...b, icon: 'mdi:source-branch', disabled: b.name === branch.value }))
    .slice(0, 5)
})

const actions = computed(() => ([
  { key: 'create', label: 'Create new branch', static: true, icon: 'heroicons-outline:plus', click: onCreateBranchClick },
  { key: 'refresh', label: 'Refresh branches', icon: 'heroicons-outline:refresh', iconClass: pendingBranches.value ? 'animate-spin' : '', click: () => { refreshBranches(true) } },
  (isDraftContent.value || isDraftMedia.value) && { key: 'reset', label: 'Revert draft', icon: 'heroicons-outline:reply', click: onResetDraftClick }
].filter(Boolean)))

const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

// Watch

whenever(and(keys.meta_b, notUsingInput), () => {
  isOpen.value = !isOpen.value
})

// Methods

async function onBranchSelect (b: GitHubBranch) {
  selectBranch(b.name)

  await refreshContentFiles()
  await refreshMediaFiles()
}

function onCreateBranchClick ({ query: name }) {
  openCreateBranchModal(
    name && !branches.value.some(b => b.name === name) ? name : '',
    branch.value === project.repository.default_branch,
    false,
    async () => {
      await refreshContentFiles()
      await refreshMediaFiles()
    }
  )
}

async function onResetDraftClick () {
  try {
    await resetDraft()

    contentDraft.value = null
    publicDraft.value = null

    // Select new file if the current file no longer exists
    initContentFile()
    initPublicFile()
  } catch {}
}

function onSelect (option, data) {
  isOpen.value = false
  if (option.click) {
    option.click(data)
  } else {
    onBranchSelect(option)
  }
}
</script>
