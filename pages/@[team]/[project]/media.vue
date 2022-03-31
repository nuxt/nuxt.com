<template>
  <ProjectPage>
    <template #header>
      <input
        ref="fileToUpload"
        name="newFile"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileUpload"
      >

      <ProjectHeader>
        <template #extra-actions>
          <UButton size="xs" label="Upload file" variant="gray" icon="heroicons-outline:plus" @click="$refs.fileToUpload.click()" />
        </template>
      </ProjectHeader>
    </template>

    <div class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <div v-if="computedFiles.length" class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
        <ProjectMediaFilesGallery />
      </div>
      <ProjectMediaFilesEmpty v-else @create="$refs.fileToUpload.click()" />

      <ProjectMediaFileAside />
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { isEmpty } from 'lodash-es'
import type { Team, Project } from '~/types'
import { getAvailablePath } from '~~/utils/tree'

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

const { $toast } = useNuxtApp()
const { upload, computedFiles } = useProjectFiles(props.project, root)

const fileToUpload: Ref<HTMLInputElement> = ref(null)

// Http

async function onFileUpload () {
  if (isEmpty(fileToUpload.value.files)) {
    return
  }

  const formData = new FormData()
  const file = fileToUpload.value.files[0]

  if (!file.type.startsWith('image/')) {
    $toast.error({ title: `File type ${file.type} is not supported` })
    return
  }

  formData.append('files.image', fileToUpload.value.files[0])

  try {
    const filePath = getAvailablePath(`public/${file.name}`, computedFiles.value)
    await upload(filePath, formData)
  } catch (e) {}
}
</script>
