<template>
  <ProjectPage>
    <template #header>
      <input
        ref="fileToUpload"
        name="newFile"
        type="file"
        accept="image/*"
        class="hidden"
        multiple
        @change="onFileUpload"
      >

      <ProjectHeader>
        <template #extra-actions>
          <UButton
            size="xs"
            label="Upload file"
            variant="gray"
            icon="heroicons-outline:plus"
            truncate
            @click="$refs.fileToUpload.click()"
          />
        </template>
      </ProjectHeader>
    </template>

    <Splitpanes class="flex items-stretch flex-1 min-h-0 overflow-hidden">
      <Pane
        class="flex-1 flex flex-col relative"
        @dragover.prevent
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div v-if="computedFiles.length" class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
          <ProjectMediaFilesGallery :medias="medias" @fileVisible="onFileVisible" />
        </div>
        <ProjectMediaFilesEmpty v-else @create="$refs.fileToUpload.click()" />

        <div
          class="absolute inset-0 border border-dashed border-transparent"
          :class="{ 'bg-blue-500 bg-opacity-20 border-blue-500': dragover }"
          style="pointer-events: none;"
        />
      </Pane>

      <Pane size="21">
        <ProjectMediaFileAside :medias="medias" class="w-full" />
      </Pane>
    </Splitpanes>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { isEmpty } from 'lodash-es'
import type { Team, Project } from '~/types'
import { getAvailablePath } from '~/utils/tree'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const root = 'public'
const project: Project = inject('project')

provide('root', root)

const { $toast } = useNuxtApp()
const { upload, computedFiles, fetchFile, uploadInput: fileToUpload } = useProjectFiles(project, root)

const dragover = ref(false)

const medias = useState(`project-${project.id}-medias`, () => ({}))

watch(computedFiles, (newFiles, oldFiles) => {
  for (const oldFile of oldFiles) {
    if (!newFiles.find(newFile => newFile.path === oldFile.path)) {
      delete medias.value[oldFile.path]
    }
  }
})

// Methods

function onDragEnter (_e) {
  dragover.value = true
}

function onDragLeave (e) {
  if (e.currentTarget.contains(e.relatedTarget)) {
    return
  }

  dragover.value = false
}

function onDrop (e) {
  dragover.value = false
  fileToUpload.value.files = e.dataTransfer.files
  onFileUpload()
}

async function onFileVisible (path) {
  const file = computedFiles.value.find(file => file.path === path)
  medias.value[path] = await fetchFile(file.oldPath || file.path)
}

// Http

async function onFileUpload () {
  if (isEmpty(fileToUpload.value.files)) {
    return
  }

  for (const file of fileToUpload.value.files) {
    const formData = new FormData()

    if (!file.type.startsWith('image/')) {
      $toast.error({ title: `File type ${file.type} is not supported` })
      continue
    }

    formData.append('files.image', file)

    try {
      const filePath = getAvailablePath(`public/${file.name}`, computedFiles.value)
      await upload(filePath, formData)
    } catch (e) {}
  }
}
</script>
