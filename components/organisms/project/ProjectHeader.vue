<template>
  <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
    <div class="flex items-center min-w-0 gap-3">
      <UButton
        icon="mdi:source-branch"
        :label="branch.name"
        variant="secondary"
        size="xs"
        truncate
        @click="$emit('openModal')"
      />
    </div>

    <div class="flex items-center gap-3">
      <UButton variant="secondary" size="sm" @click="$emit('openModal')">
        <UIcon name="heroicons-outline:search" class="w-4 h-4 u-text-gray-400 mr-1.5 flex-shrink-0" />
        <span class="flex-auto mr-3 u-text-gray-400 truncate">Search...</span>
        <kbd class="font-sans font-semibold u-text-gray-500 text-xs flex-shrink-0"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
      </UButton>

      <UButton
        v-if="isDraft"
        label="Save"
        :loading="loading"
        size="sm"
        icon="heroicons-outline:check"
        trailing
        @click="commit"
      />
      <UButton
        v-else-if="branch.name !== project.repository.default_branch"
        label="Publish"
        :loading="loading"
        size="sm"
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
const root: string = inject('root')

defineEmits(['openModal'])

const { branch } = useProjectBranches(project)
const { isDraft, commit, loading, openPublishModal } = useProjectFiles(project, root)
</script>
