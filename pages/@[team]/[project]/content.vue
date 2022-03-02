<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="selectedFile" @select-file="selectFile" />
    </template>

    <div class="whitespace-pre break-words text-sm font-mono focus:outline-none" contenteditable>
      {{ content }}
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, File } from '~/types'

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

const client = useStrapiClient()

const { data: files } = await useAsyncData('files', () => client<File[]>(`/projects/${props.project.id}/tree`))

const selectedFile: Ref<File> = ref(files.value.find(file => file.path.toLowerCase().endsWith('index.md')) || files.value.find(file => file.type === 'file'))

const content = ref('')

function selectFile (file) {
  selectedFile.value = file
}

watch(selectedFile, async () => {
  if (!selectedFile.value) {
    return
  }

  const { content: fetchedContent } = await client(`/projects/${props.project.id}/file`, {
    params: {
      path: selectedFile.value.path
    }
  })

  content.value = fetchedContent
}, { immediate: true })
</script>
