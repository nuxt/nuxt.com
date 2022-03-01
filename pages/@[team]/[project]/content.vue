<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="selectedFile" @select-file="selectFile" />
    </template>

    <pre class="whitespace-pre break-words text-sm"><code>{{ selectedFile }}</code></pre>
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

const selectedFile: Ref<File> = ref(files.value.find(file => file.path.endsWith('index.md')))

function selectFile (file) {
  selectedFile.value = file
}
</script>
