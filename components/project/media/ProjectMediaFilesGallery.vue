<template>
  <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 xl:gap-x-8">
    <ProjectMediaFilesGalleryItem
      v-for="file in computedFiles"
      :key="file.path"
      :medias="medias"
      :file="file"
      @fileVisible="(e) => $emit('fileVisible', e)"
    />
  </ul>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Project, Root } from '~/types'

defineProps({
  medias: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['fileVisible'])

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { computedFiles } = useProjectFiles(project.value, root.value)
</script>
