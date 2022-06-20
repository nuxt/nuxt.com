<template>
  <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
    <div class="flex items-center min-w-0 gap-3">
      <h2 class="hidden text-lg font-semibold sm:block u-text-gray-900">
        {{ project.name }}
      </h2>

      <UButton
        v-if="branches.length"
        icon="mdi:source-branch"
        variant="gray"
        size="xs"
        class="hidden truncate lg:inline-flex"
        @click="openBranchesModal"
      >
        <span class="flex-auto truncate u-text-gray-700">{{ branch.name }}</span>
        <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> B</kbd>
      </UButton>
      <UButton icon="heroicons-outline:search" variant="gray" size="xs" class="hidden truncate lg:inline-flex" @click="openFilesModal">
        <span class="flex-auto truncate u-text-gray-700">Search</span>
        <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
      </UButton>

      <slot v-if="branches.length" name="extra-actions" />
    </div>

    <div v-if="branches.length" class="flex items-center min-w-0 gap-3">
      <ProjectHeaderUsers class="hidden lg:flex" />

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
import type { Ref } from 'vue'
import { useMagicKeys, whenever, and, or, not } from '@vueuse/core'
import type { Project } from '~/types'

const project: Ref<Project> = inject('project')

const { openBranchesModal, openFilesModal } = useProjectModals()

const { branch, branches, commit, openPublishModal, openCreateModal, loading } = useProjectBranches(project.value)
const { isDraft: isDraftContent, refresh: refreshContentFiles, previewUrl } = useProjectFiles(project.value, 'content')
const { isDraft: isDraftMedia, refresh: refreshMediaFiles } = useProjectFiles(project.value, 'public')

const deployOptions = [[{
  icon: 'logos:vercel-icon',
  label: 'Deploy to Vercel',
  to: `https://vercel.com/new/import?repository-url=${encodeURIComponent(`https://github.com/${project.value.repository.owner}/${project.value.repository.name}`)}`,
  target: '_blank'
},
{
  icon: 'logos:netlify',
  label: 'Deploy to Netlify',
  // Netlify deploy button only supports creating new repositories
  to: 'https://app.netlify.com/start',
  target: '_blank'
}], [{
  icon: 'heroicons-outline:cog',
  label: 'Enter project url',
  to: { name: '@team-project-settings' }
}]]

const { meta_s: metaS } = useMagicKeys({
  passive: false,
  onEventFired (e) {
    if (e.metaKey && e.key === 's' && e.type === 'keydown') {
      e.preventDefault()
    }
  }
})

// Watch

whenever(and(metaS, or(isDraftContent, isDraftMedia), not(loading)), onCommitClick)

// Methods

async function onCommitClick () {
  const callbackAfterCommit = () => {
    refreshContentFiles()
    refreshMediaFiles()
  }

  if (branch.value.name === project.value.repository.default_branch) {
    return openCreateModal('', true, true, callbackAfterCommit)
  }

  await commit()

  callbackAfterCommit()
}
</script>
