<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-green-100 rounded-full dark:bg-green-500 sm:mx-0 sm:h-10 sm:w-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-green-500 dark:text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>

      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Create file
        </h3>
        <div class="mt-2">
          <p class="text-sm break-words u-text-gray-500">
            This file will be added to your draft.
          </p>
        </div>
      </div>
    </div>
    <div class="flex items-center w-full mt-5 sm:mt-4">
      <span v-if="path" class="flex-shrink-0 max-w-[200px] truncate px-3 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-200 rounded-l-lg u-text-gray-500">
        {{ path }}/
      </span>

      <UInput
        v-model="name"
        name="name"
        placeholder="faq/index.md"
        required
        autocomplete="off"
        class="flex-1 w-auto"
        :custom-class="`rounded-r-none ${path && 'rounded-l-none'}`"
      />

      <span class="flex-shrink-0 max-w-[200px] truncate px-3 py-2 text-sm border border-l-0 u-bg-gray-50 u-border-gray-200 rounded-r-lg u-text-gray-500">
        {{ ext }}
      </span>
    </div>
    <div v-if="error" class="mt-2 text-sm italic text-red-500">
      {{ error }}
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Create" variant="green" class="justify-center flex-shrink-0 w-full sm:w-auto" :disabled="!!error" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="close" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GitHubFile } from '~/types'

const props = defineProps({
  computedFiles: {
    type: Array as PropType<GitHubFile[]>,
    required: true
  },
  path: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'close'])

const name = ref('')
const ext = ref('.md')
const newPath = computed(() => `${props.path}/${name.value}${ext.value}`)
const error = computed(() => {
  if (props.computedFiles.find(file => file.path === newPath.value)) {
    return 'File already exists'
  } else {
    return ''
  }
})

const isOpen = ref(true)

function close () {
  isOpen.value = false
  onClose()
}
function onSubmit () {
  emit('submit', newPath.value)
  close()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
