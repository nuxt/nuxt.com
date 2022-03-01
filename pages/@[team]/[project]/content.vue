<template>
  <ProjectPage title="Content">
    <template #aside>
      <FilesTree :files="files" :selected-file="selectedFile" @select-file="selectFile" />
    </template>

    Editor
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, File } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const files: Ref<File[]> = ref([
  {
    type: 'directory',
    path: 'content/blog',
    name: 'blog',
    children: [
      {
        type: 'file',
        path: 'content/blog/1.molestie-ac-feugiat-sed-lectus.md',
        name: '1.molestie-ac-feugiat-sed-lectus.md',
        isDraft: true
      },
      {
        type: 'file',
        path: 'content/blog/2.commodo-sed-egestas-egestas-fringilla-phasellus.md',
        name: '2.commodo-sed-egestas-egestas-fringilla-phasellus.md',
        isDraft: true
      },
      {
        type: 'file',
        path: 'content/blog/3.praesent-semper-feugiat-nibh-sed-pulvinar-proin.md',
        name: '3.praesent-semper-feugiat-nibh-sed-pulvinar-proin.md'
      },
      {
        type: 'file',
        path: 'content/blog/4.molestie-ac-feugiat-sed-lectus.md',
        name: '4.molestie-ac-feugiat-sed-lectus.md'
      }
    ]
  },
  {
    type: 'file',
    path: 'content/index.md',
    name: 'index.md'
  }
])
const selectedFile: Ref<File> = ref(files.value.find(file => file.path.endsWith('index.md')))

function selectFile (file) {
  selectedFile.value = file
}
</script>
