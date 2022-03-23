<template>
  <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
    <div class="flex items-center min-w-0 gap-3">
      <UButton icon="mdi:source-branch" variant="secondary" size="xs" truncate @click="openBranchesModal">
        <span class="flex-auto mr-3 u-text-gray-700 truncate">{{ branch.name }}</span>
        <kbd class="font-sans font-semibold u-text-gray-400 text-xs flex-shrink-0"><abbr title="Command" class="no-underline">⌘</abbr> B</kbd>
      </UButton>
      <UButton icon="heroicons-outline:search" variant="secondary" size="xs" truncate @click="openFilesModal">
        <span class="flex-auto mr-3 u-text-gray-700 truncate">Search</span>
        <kbd class="font-sans font-semibold u-text-gray-400 text-xs flex-shrink-0"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
      </UButton>
      <slot name="extra-actions" />
    </div>

    <div class="flex items-center gap-3">
      <UButton
        v-if="isDraftContent || isDraftMedia"
        label="Save"
        :loading="loading"
        size="xs"
        icon="heroicons-outline:check"
        trailing
        @click="commit"
      />
      <UButton
        v-else-if="branch.name !== project.repository.default_branch"
        label="Publish"
        :loading="loading"
        size="xs"
        icon="heroicons-outline:cloud-upload"
        trailing
        @click="openPublishModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

defineEmits(['openModal'])

const { openBranchesModal, openFilesModal } = useProjectModals()

const { branch } = useProjectBranches(project)
const { isDraft: isDraftContent, commit, loading, openPublishModal } = useProjectFiles(project, 'content')
const { isDraft: isDraftMedia } = useProjectFiles(project, 'media')
</script>
