<template>
  <ProjectPage>
    <template #header>
      <ProjectHeader>
        <template #extra-actions>
          <UButton
            size="xs"
            label="Upload file"
            icon="heroicons-outline:plus"
          />
        </template>
      </ProjectHeader>
    </template>

    <div class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <div class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <ProjectMediaFilesGallery />
      </div>

      <ProjectMediaFileAside v-if="file" />
    </div>
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

const { file } = useProjectFiles(props.project, root)
</script>
