<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-500 sm:mx-0 sm:h-10 sm:w-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          aria-hidden="true"
          role="img"
          class="text-green-500 dark:text-white h-6 w-6"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d="M13 14c-3.36 0-4.46 1.35-4.82 2.24C9.25 16.7 10 17.76 10 19a3 3 0 0 1-3 3a3 3 0 0 1-3-3c0-1.31.83-2.42 2-2.83V7.83A2.99 2.99 0 0 1 4 5a3 3 0 0 1 3-3a3 3 0 0 1 3 3c0 1.31-.83 2.42-2 2.83v5.29c.88-.65 2.16-1.12 4-1.12c2.67 0 3.56-1.34 3.85-2.23A3.006 3.006 0 0 1 14 7a3 3 0 0 1 3-3a3 3 0 0 1 3 3c0 1.34-.88 2.5-2.09 2.86C17.65 11.29 16.68 14 13 14m-6 4a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M7 4a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m10 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1Z" />
        </svg>
      </div>

      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Create branch
        </h3>
        <div class="mt-2">
          <p class="text-sm break-words u-text-gray-500">
            {{ mergeDraft ? 'Your draft will be transferred to the new branch.' : 'This branch will be added to your GitHub repository.' }}
          </p>
        </div>
      </div>
    </div>
    <div class="flex items-center w-full mt-5 sm:mt-4">
      <UInput
        v-model="name"
        name="name"
        placeholder="feat/my-feature"
        required
        class="w-full"
      />
    </div>
    <div v-if="error" class="text-red-500 text-sm italic mt-2">
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
import { GitHubBranch } from '~/types'

const props = defineProps({
  branches: {
    type: Array as PropType<GitHubBranch[]>,
    default: () => []
  },
  name: {
    type: String,
    default: ''
  },
  mergeDraft: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'close'])

const name = ref(props.name)
const error = computed(() => {
  if (props.branches.find(b => b.name === name.value)) {
    return 'Branch already exists'
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
  emit('submit', name.value)
  close()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
