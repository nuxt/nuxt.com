<template>
  <ProjectPage title="Content">
    <template #aside>
      <div class="px-6">
        Files...
      </div>
    </template>

    Editor
  </ProjectPage>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Project } from '~/types'

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
</script>
