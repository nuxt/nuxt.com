<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mt-3 text-center sm:mt-0 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Publish branch
        </h3>
        <div class="mt-2 space-y-3 divide-y u-divide-gray-100">
          <p class="text-sm break-all u-text-gray-500">
            You're about to publish <span class="font-medium u-text-gray-900">{{ branch.name }}</span>.<br>This branch will be merged into your repository default branch <span class="font-medium u-text-gray-900">{{ project.repository.default_branch }}</span>.
          </p>
          <p class="pt-3 text-sm break-all u-text-gray-500">
            You can also <a :href="`https://github.com/${project.repository.owner}/${project.repository.name}/compare/${project.repository.default_branch}...${branch.name}`" target="_blank" class="font-medium text-primary-500 hover:underline">compare the changes / create a pull request</a> on GitHub.
          </p>
        </div>
      </div>
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Publish" variant="primary" class="justify-center flex-shrink-0 w-full sm:w-auto" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="close" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'
import type { PropType } from 'vue'
import type { Project, Branch } from '~/types'

const props = defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  },
  branch: {
    type: Object as PropType<Branch>,
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
