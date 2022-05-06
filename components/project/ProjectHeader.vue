<template>
  <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
    <div class="flex items-center min-w-0 gap-3">
      <h2 class="hidden sm:block font-bold text-lg u-text-gray-900">
        {{ project.name }}
      </h2>

      <UButton
        v-if="branches.length"
        icon="mdi:source-branch"
        variant="gray"
        size="xs"
        class="truncate"
        @click="openBranchesModal"
      >
        <span class="flex-auto u-text-gray-700 truncate">{{ branch.name }}</span>
        <kbd class="hidden sm:inline ml-3 font-sans font-semibold u-text-gray-400 text-xs flex-shrink-0"><abbr title="Command" class="no-underline">⌘</abbr> B</kbd>
      </UButton>
      <UButton icon="heroicons-outline:search" variant="gray" size="xs" class="truncate" @click="openFilesModal">
        <span class="flex-auto u-text-gray-700 truncate">Search</span>
        <kbd class="hidden sm:inline ml-3 font-sans font-semibold u-text-gray-400 text-xs flex-shrink-0"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
      </UButton>
      <slot v-if="branches.length" name="extra-actions" />
    </div>

    <div v-if="branches.length" class="flex items-center gap-3 min-w-0">
      <ProjectHeaderUsers />

      <UButton
        v-if="isDraftContent || isDraftMedia"
        label="Save"
        :loading="loading"
        size="xs"
        icon="heroicons-outline:check"
        trailing
        truncate
        @click="onCommitClick"
      />
      <UButton
        v-else-if="branch?.name !== project.repository.default_branch"
        label="Publish"
        :loading="loading"
        size="xs"
        icon="heroicons-outline:cloud-upload"
        trailing
        truncate
        @click="openPublishModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

const { openBranchesModal, openFilesModal } = useProjectModals()

const { branch, branches, commit, openPublishModal, openCreateModal, loading } = useProjectBranches(project)
const { isDraft: isDraftContent, refresh: refreshContentFiles } = useProjectFiles(project, 'content')
const { isDraft: isDraftMedia, refresh: refreshMediaFiles } = useProjectFiles(project, 'public')

async function onCommitClick () {
  const callbackAfterCommit = () => {
    refreshContentFiles()
    refreshMediaFiles()
  }

  if (branch.value.name === project.repository.default_branch) {
    return openCreateModal('', true, true, callbackAfterCommit)
  }

  await commit()

  callbackAfterCommit()
}
</script>
