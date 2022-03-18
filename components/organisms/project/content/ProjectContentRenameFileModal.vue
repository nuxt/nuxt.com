<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-500 sm:mx-0 sm:h-10 sm:w-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-blue-500 dark:text-white h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>

      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Rename file
        </h3>
        <div class="mt-2">
          <p class="text-sm break-all u-text-gray-500">
            This file will be renamed in your draft.
          </p>
        </div>
      </div>
    </div>
    <div class="flex items-center w-full mt-5 sm:mt-4">
      <span v-if="path" class="flex-shrink-0 max-w-[200px] truncate px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-text-gray-500">
        {{ path }}/
      </span>

      <UInput
        v-model="newName"
        name="name"
        placeholder="faq/index.md"
        required
        autofocus
        class="w-full"
        :custom-class="path && 'rounded-l-none'"
      />
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Save" variant="blue" class="justify-center flex-shrink-0 w-full sm:w-auto" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="close" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  oldPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['submit', 'close'])

const [name, ...dir] = props.oldPath.split('/').reverse()
const path = ref(dir.reverse().join('/'))
const newName = ref(name)

const isOpen = ref(true)

function close () {
  isOpen.value = false
  onClose()
}
function onSubmit () {
  emit('submit', props.oldPath, [path.value, newName.value].join('/'))
  close()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
