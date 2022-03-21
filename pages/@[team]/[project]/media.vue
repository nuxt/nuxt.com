<template>
  <ProjectPage class="items-stretch">
    <template #header>
      <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
        <div class="flex items-center min-w-0 gap-3">
          <UButton
            v-if="branch"
            icon="mdi:source-branch"
            :label="branch.name"
            variant="secondary"
            size="xs"
            truncate
            @click="modal = true"
          />

          <p v-if="file" class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-500">
            <span class="truncate">{{ file.path }}</span>
            <UButton
              icon="heroicons-outline:external-link"
              target="_blank"
              :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${file.path}`"
              variant="transparent"
              size="xxs"
              class="!p-0"
            />
          </p>
        </div>

        <div class="flex items-center gap-3">
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

    <div class="flex items-stretch flex-1 min-h-0">
      <div class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-2xl font-bold u-text-gray-900">
            Media library
          </h2>

          <UButton
            size="sm"
            rounded
            label="Upload file"
            icon="heroicons-outline:plus"
            class="-my-1"
            variant="secondary"
            trailing
          />
        </div>

        <div class="pb-16 mt-8" aria-labelledby="gallery-heading">
          <ProjectMediaGallery />
        </div>
      </div>

      <ProjectMediaFileAside />
    </div>

    <ProjectCommandModal v-model="modal" />

    <div ref="modalContainer" />
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Project } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const root = 'public'

provide('project', props.project)
provide('root', root)

const { container: modalContainer } = useModal()
const { branch } = useProjectBranches(props.project)
const { isDraft, file, fetch: fetchFiles, refresh: refreshFiles, commit, loading, openPublishModal } = useProjectFiles(props.project, root)

const modal = ref(false)

// Http

await fetchFiles()

// Watch

// Fetch files when branch changes
watch(branch, () => refreshFiles())
</script>
