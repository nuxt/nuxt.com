<template>
  <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
    <div class="flex items-center min-w-0 gap-3">
      <h2 class="hidden text-lg font-bold sm:block u-text-gray-900">
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
        <span class="flex-auto truncate u-text-gray-700">{{ branch.name }}</span>
        <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> B</kbd>
      </UButton>
      <UButton icon="heroicons-outline:search" variant="gray" size="xs" class="truncate" @click="openFilesModal">
        <span class="flex-auto truncate u-text-gray-700">Search</span>
        <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
      </UButton>
      <UButton icon="fa-brands:github" variant="gray" size="xs" @click="openGithub">
        <span class="flex-auto truncate u-text-gray-700">Open</span>
        <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> G</kbd>
      </UButton>

      <slot v-if="branches.length" name="extra-actions" />
    </div>

    <div v-if="branches.length" class="flex items-center min-w-0 gap-3">
      <ProjectHeaderUsers />

      <UDropdown v-if="!project.url" :items="deployOptions">
        <UButton label="Deploy" variant="secondary" size="xs" icon="heroicons-outline:chevron-down" trailing />
      </UDropdown>

      <UButton
        v-if="previewUrl"
        :to="previewUrl"
        target="_blank"
        size="xs"
        label="Preview"
        trailing
        icon="heroicons-outline:external-link"
        variant="secondary"
      />

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
import { useMagicKeys, whenever, and, useActiveElement } from '@vueuse/core'
import type { Project } from '~/types'

const project: Project = inject('project')

const keys = useMagicKeys()
const activeElement = useActiveElement()
const { openBranchesModal, openFilesModal } = useProjectModals()

const { branch, branches, commit, openPublishModal, openCreateModal, openGithub, loading } = useProjectBranches(project)
const { isDraft: isDraftContent, refresh: refreshContentFiles, previewUrl } = useProjectFiles(project, 'content')
const { isDraft: isDraftMedia, refresh: refreshMediaFiles } = useProjectFiles(project, 'public')

const deployOptions = [[
  {
    icon: 'logos:vercel-icon',
    label: 'Deploy to Vercel',
    to: `https://vercel.com/new/import?repository-url=${encodeURIComponent(`https://github.com/${project.repository.owner}/${project.repository.name}`)}`,
    target: '_blank'
  },
  {
    icon: 'logos:netlify',
    label: 'Deploy to Netlify',
    // Netlify deploy button only supports creating new repositories
    to: 'https://app.netlify.com/start',
    target: '_blank'
  }
]]

// Computed

const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

// Watch

whenever(and(keys.meta_g, notUsingInput), openGithub)

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
