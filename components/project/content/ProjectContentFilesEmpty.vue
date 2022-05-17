<template>
  <div class="flex flex-col items-center justify-center flex-1 p-6">
    <UIcon name="heroicons-outline:folder" class="w-12 h-12 mx-auto u-text-gray-400" />
    <h3 class="mt-2 text-sm font-medium u-text-gray-900">
      No files in <span class="italic">content</span> directory
    </h3>
    <p v-if="branches.length" class="mt-1 text-sm u-text-gray-500">
      Get started by creating a new file.
    </p>
    <div v-if="branches.length" class="mt-6">
      <UButton label="Create file" size="xs" icon="heroicons-outline:plus" @click="$emit('create')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

defineEmits(['create'])

const project: Project = inject('project')

const { branches } = useProjectBranches(project)
</script>
