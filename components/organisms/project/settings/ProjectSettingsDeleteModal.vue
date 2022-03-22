<template>
  <UModal v-model="isOpen" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-500 sm:mx-0 sm:h-10 sm:w-10">
        <UIcon
          name="heroicons-outline:trash"
          class="text-red-500 dark:text-white h-6 w-6"
        />
      </div>

      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Delete project
        </h3>
        <div class="mt-2">
          <p class="text-sm break-all u-text-gray-500">
            Are you sure you want to delete this project? This action is not reversible. Please be certain.
          </p>
        </div>
      </div>
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Delete" variant="red" class="justify-center flex-shrink-0 w-full sm:w-auto" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="isOpen = false" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['submit', 'update:modelValue'])

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

function onSubmit () {
  emit('submit')
  isOpen.value = false
}
</script>
