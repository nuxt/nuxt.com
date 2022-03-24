<template>
  <ProjectPage>
    <template #header>
      <input ref="fileToUpload" name="newFile" type="file" class="hidden" @change="onFileUpload">

      <ProjectHeader>
        <template #extra-actions>
          <UButton size="xs" label="Upload file" variant="secondary" icon="heroicons-outline:plus" @click="$refs.fileToUpload.click()" />
        </template>
      </ProjectHeader>
    </template>

    <div class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <div class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <ProjectMediaFilesGallery />
      </div>

      <ProjectMediaFileAside />
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { isEmpty } from 'lodash-es'
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

const { create: uploadFile } = useProjectFiles(props.project, root)

const fileToUpload: Ref<HTMLInputElement> = ref(null)

// Http

async function onFileUpload () {
  if (isEmpty(fileToUpload.value.files)) {
    return
  }

  const formData = new FormData()
  const file = fileToUpload.value.files[0]
  formData.append('files.image', fileToUpload.value.files[0])

  await uploadFile(`public/${file.name}`, formData)
}
</script>
