<template>
  <div>
    <nav class="flex h-12 px-6 space-x-4 border-b u-border-gray-200">
      <button
        v-for="(category, index) in ['Meta', 'History']"
        :key="index"
        :class="{
          'font-medium u-text-gray-900 u-border-gray-700': selectedIndex === index,
          'u-text-gray-500 hover:u-text-gray-900 border-transparent': selectedIndex !== index
        }"
        class="px-2 -mb-px border-b-2 focus:outline-none"
        tabindex="-1"
        @click="selectedIndex = index"
      >
        {{ category }}
      </button>

      <div class="flex items-center justify-end flex-1 h-full gap-3">
        <UButton
          v-if="isDraft(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:reply"
          @click.stop="revertFile(computedFile.path)"
        />
        <UButton
          v-if="!isDeleted(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:pencil"
          @click.stop="renameFile(computedFile.path)"
        />
        <UButton
          v-if="!isDeleted(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:trash"
          @click.stop="deleteFile(computedFile.path)"
        />
      </div>
    </nav>

    <div class="p-6">
      <div v-if="selectedIndex === 0" class="space-y-3">
        <dl class="divide-y u-divide-gray-200">
          <div class="flex justify-between pb-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Size
            </dt>
            <dd class="u-text-gray-900">
              {{ toFormattedBytes(computedFile.size) }}
            </dd>
          </div>
          <div v-if="medias[computedFile.path]" class="flex justify-between pt-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Dimensions
            </dt>
            <dd class="u-text-gray-900">
              {{ medias[computedFile.path].width }} x {{ medias[computedFile.path].height }}
            </dd>
          </div>
        </dl>
      </div>

      <div v-if="selectedIndex === 1">
        <ProjectFileHistory />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Project, Root, GitHubFile } from '~/types'
import { toFormattedBytes } from '~/utils'

defineProps({
  medias: {
    type: Object,
    default: () => ({})
  }
})

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { computedFile, openRenameModal, openRevertModal, openDeleteModal } = useProjectFiles(project.value, root.value)

const selectedIndex = useState(`project-${project.value.id}-${root.value}-aside-tabs`, () => 0)

// Methods

const isDraft = (file: GitHubFile) => !!file.status
const isDeleted = (file: GitHubFile) => file.status === 'deleted'

const revertFile = (path) => {
  openRevertModal(path)
}
const renameFile = (path) => {
  openRenameModal(path)
}
const deleteFile = (path) => {
  openDeleteModal(path)
}
</script>
