<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mt-3 text-center sm:mt-0 sm:text-left">
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
      <UButton type="submit" label="Save" class="justify-center flex-shrink-0 w-full sm:w-auto" />
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

function onSubmit () {
  emit('submit', props.oldPath, [path.value, newName.value].join('/'))
  isOpen.value = false
  onClose()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
