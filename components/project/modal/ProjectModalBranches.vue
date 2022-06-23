<template>
  <UModal v-model="isOpen" width-class="max-w-xl" body-class="relative flex flex-col h-[calc(100vh-2rem)] overflow-hidden sm:h-80">
    <ProjectCombobox
      :items="currentBranches"
      items-label="Branches"
      :recent-items="recentItems"
      :actions="actions"
      @select="onSelect"
      @close="isOpen = false"
    />
  </UModal>
</template>

<script setup lang="ts">
import type { WritableComputedRef, Ref, ComputedRef } from 'vue'
import { useMagicKeys, whenever, and } from '@vueuse/core'
import type { GitHubBranch, GitHubPull, Project } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const project: Ref<Project> = inject('project')
const pulls: Ref<GitHubPull[]> = ref([])

const emit = defineEmits(['update:modelValue'])

const { notUsingInput } = useShortcuts()
const keys = useMagicKeys()

const {
  isDraft: isDraftContent,
  draft: contentDraft,
  init: initContentFile
} = useProjectFiles(project.value, 'content')
const {
  isDraft: isDraftMedia,
  draft: publicDraft,
  init: initPublicFile
} = useProjectFiles(project.value, 'public')
const {
  branch,
  branches,
  recentBranches,
  pending: pendingBranches,
  refresh: refreshBranches,
  reset: resetDraft,
  select: selectBranch,
  openCreateModal: openCreateBranchModal,
  fetchPulls
} = useProjectBranches(project.value)

// Computed

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const currentBranches: ComputedRef<GitHubBranch[]> = computed(() => {
  return [...branches.value]
    .map((b) => {
      let pull

      const githubPull = pulls.value.find(pull => pull.base.ref === project.value.repository.default_branch && pull.head.ref === b.name)
      if (githubPull) {
        const totalCheck = githubPull.check_runs.length + githubPull.statuses.length

        if (totalCheck > 0) {
          let validatedCheck = 0
          githubPull.check_runs.forEach((checkRun) => {
            if (['success', 'neutral'].includes(checkRun.conclusion)) {
              validatedCheck += 1
            }
          })
          githubPull.statuses.forEach((status) => {
            if (status.state === 'success') {
              validatedCheck += 1
            }
          })

          pull = {
            number: githubPull.number,
            success: validatedCheck === totalCheck,
            description: `${validatedCheck}/${totalCheck} check${totalCheck > 1 ? 's' : ''} OK`,
            url: githubPull.html_url
          }
        }
      }

      return {
        ...b,
        icon: 'mdi:source-branch',
        disabled: b.name === branch.value.name,
        pull
      }
    })
})

const recentItems = computed(() => {
  return [...recentBranches.value]
    .filter(rb => branches.value.find(b => b.name === rb.name))
    .filter(rb => rb.name !== branch.value.name)
    .sort((a, b) => b.openedAt - a.openedAt)
    .map(b => ({ ...b, icon: 'mdi:source-branch', disabled: b.name === branch.value.name }))
    .slice(0, 5)
})

const actions = computed(() => ([
  {
    key: 'create',
    label: 'Create new branch',
    static: true,
    icon: 'heroicons-outline:plus',
    click: onCreateBranchClick
  },
  {
    key: 'refresh',
    label: 'Refresh branches',
    icon: 'heroicons-outline:refresh',
    iconClass: pendingBranches.value ? 'animate-spin' : '',
    click: () => { refreshBranches(true) && fetchPulls() },
    prevent: true
  },
  (isDraftContent.value || isDraftMedia.value) && { key: 'reset', label: 'Revert draft', icon: 'heroicons-outline:reply', click: onResetDraftClick }
].filter(Boolean)))

// Watch

whenever(and(keys.meta_b, notUsingInput), () => {
  isOpen.value = !isOpen.value
})
whenever(and(keys.escape, isOpen), () => {
  isOpen.value = false
})

watch(isOpen, async (value) => {
  if (value) {
    pulls.value = await fetchPulls()
  }
})

// Methods

function onBranchSelect (b: GitHubBranch) {
  selectBranch(b)
}

function onCreateBranchClick ({ query: name }) {
  openCreateBranchModal(
    name && !branches.value.some(b => b.name === name) ? name : '',
    branch.value.name === project.value.repository.default_branch,
    false
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
  if (!option.prevent) {
    isOpen.value = false
  }

  if (option.click) {
    option.click(data)
  } else {
    onBranchSelect(option)
  }
}

// Hooks

onMounted(async () => {
  pulls.value = await fetchPulls()
})
</script>
