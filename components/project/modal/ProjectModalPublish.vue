<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-gray-900 rounded-full dark:bg-white sm:mx-0 sm:h-10 sm:w-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-white dark:text-gray-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Publish branch
        </h3>
        <div class="mt-2 space-y-3 divide-y u-divide-gray-100">
          <p class="text-sm break-words u-text-gray-500">
            You're about to publish <span class="font-medium u-text-gray-900">{{ branch.name }}</span>.<br>This branch will be merged into your repository default branch <span class="font-medium u-text-gray-900">{{ project.repository.default_branch }}</span>.
          </p>
          <p class="pt-3 text-sm break-words u-text-gray-500">
            You can also <a :href="`https://github.com/${project.repository.owner}/${project.repository.name}/compare/${project.repository.default_branch}...${branch.name}`" target="_blank" class="font-medium text-primary-500 hover:underline">compare the changes / create a pull request</a> on GitHub.
          </p>
        </div>
      </div>
    </div>
    <div class="gap-3 mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Publish" variant="primary" class="justify-center flex-shrink-0 w-full sm:w-auto" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="close" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Project, GitHubBranch } from '~/types'

defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  },
  branch: {
    type: Object as PropType<GitHubBranch>,
    required: true
  }
})

const emit = defineEmits(['submit', 'close'])

const isOpen = ref(true)

function close () {
  isOpen.value = false
  onClose()
}
function onSubmit () {
  emit('submit')
  close()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
