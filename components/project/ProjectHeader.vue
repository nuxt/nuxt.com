<template>
  <div
    class="flex flex-col flex-1 min-w-0 transition-all"
    :class="{
      'h-16': !isOpen,
      'h-[calc(100vh-64px)] lg:h-16': isOpen
    }"
  >
    <div class="flex items-center justify-between flex-shrink-0 h-16 min-w-0 gap-3 px-4 sm:px-6">
      <div class="items-center hidden min-w-0 gap-3 lg:flex">
        <h2 class="text-lg font-semibold u-text-gray-900">
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
          <span class="flex-1 truncate u-text-gray-700 max-w-[128px]">{{ branch.name }}</span>
          <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> B</kbd>
        </UButton>
        <UButton icon="heroicons-outline:search" variant="gray" size="xs" class="truncate" @click="openFilesModal">
          <span class="flex-auto truncate u-text-gray-700">Search</span>
          <kbd class="flex-shrink-0 hidden ml-3 font-sans text-xs font-semibold sm:inline u-text-gray-400"><abbr title="Command" class="no-underline">⌘</abbr> K</kbd>
        </UButton>

        <slot v-if="branches.length" name="extra-actions" />
      </div>

      <div class="flex items-center flex-1 min-w-0 gap-3 lg:hidden">
        <UIcon :name="isOpen ? 'heroicons-solid:chevron-up' : 'heroicons-solid:chevron-down'" class="flex-shrink-0 w-6 h-6 u-text-gray-700" @click="isOpen = !isOpen" />

        <div v-if="computedFile" class="flex flex-col flex-1 min-w-0">
          <h2 class="font-medium truncate u-text-gray-900">
            <span class="sr-only">Details for </span>{{ computedFile.name }}
          </h2>
          <div class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
            <span class="truncate">{{ computedFile.path }}</span>

            <UTooltip>
              <UButton
                icon="heroicons-outline:external-link"
                target="_blank"
                :to="githubLink"
                variant="transparent"
                size="xxs"
                class="!p-0"
              />

              <template #text>
                <span class="flex-auto truncate">Open on GitHub</span>
                <kbd class="flex-shrink-0 hidden font-sans text-xs font-semibold u-text-gray-300 sm:inline"><abbr title="Command" class="no-underline">⌘</abbr> G</kbd>
              </template>
            </UTooltip>
          </div>
        </div>
      </div>

      <div v-if="branches.length" class="flex items-center flex-shrink-0 min-w-0 gap-1.5 lg:gap-3">
        <ProjectHeaderUsers class="hidden lg:flex" />

        <UButton
          v-if="['@team-project-content', '@team-project-media'].includes(route.name as string)"
          variant="secondary"
          size="xs"
          icon="heroicons-outline:plus"
          class="lg:hidden"
          @click="onNewFile"
        />

        <UDropdown v-if="!project.url" :items="deployOptions">
          <UButton
            label="Deploy"
            variant="secondary"
            size="xs"
            icon="heroicons-outline:chevron-down"
            trailing
            class="hidden lg:inline-flex"
          />
          <UButton variant="secondary" size="xs" icon="heroicons-outline:dots-vertical" trailing class="lg:hidden" />
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
          class="hidden lg:inline-flex"
        />
        <UButton
          v-if="previewUrl"
          :to="previewUrl"
          target="_blank"
          size="xs"
          icon="heroicons-outline:external-link"
          variant="secondary"
          class="lg:hidden"
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
    <div
      v-if="isOpen"
      class="flex flex-col flex-1 pb-8 overflow-y-auto lg:hidden"
    >
      <ProjectContentFileAsideTabs
        v-if="route.name === '@team-project-content'"
        :model-value="modelValue"
        @update:model-value="(e) => $emit('update:modelValue', e)"
      />
      <ProjectMediaFileAsideTabs v-if="route.name === '@team-project-media'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useMagicKeys, whenever, and, or, not } from '@vueuse/core'
import type { Project } from '~/types'

defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'createFile', 'uploadFile'])

const project: Ref<Project> = inject('project')

const route = useRoute()
const { openBranchesModal, openFilesModal } = useProjectModals()

const { branch, branches, commit, openPublishModal, openCreateModal, loading } = useProjectBranches(project.value)
const { computedFile: contentFile, isDraft: isDraftContent, refresh: refreshContentFiles, previewUrl } = useProjectFiles(project.value, 'content')
const { computedFile: publicFile, isDraft: isDraftMedia, refresh: refreshMediaFiles } = useProjectFiles(project.value, 'public')

const { magicKeysOptions } = useShortcuts()
const keys = useMagicKeys(magicKeysOptions({
  prevents: [{ metaKey: true, key: 's' }]
}))

const isOpen = ref(false)

const computedFile = computed(() => {
  if (route.name === '@team-project-content') {
    return contentFile.value
  } else if (route.name === '@team-project-media') {
    return publicFile.value
  }
})

const absolutePath = computed(() => {
  return [...project.value.baseDir.split('/').filter(p => p !== '.'), ...computedFile.value?.path?.split('/')]
    .filter(Boolean)
    .join('/')
})

const githubLink = computed(() => {
  return `https://github.com/${project.value.repository.owner}/${project.value.repository.name}/tree/${branch.value.name}/${absolutePath.value}`
})

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

// Watch

whenever(and(keys.meta_s, or(isDraftContent, isDraftMedia), not(loading)), onCommitClick)

// Methods
function onNewFile () {
  if (route.name === '@team-project-content') {
    emit('createFile')
  } else if (route.name === '@team-project-media') {
    emit('uploadFile')
  }
}

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
