<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="text-center sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Delete file
        </h3>
        <div class="mt-2">
          <p class="text-sm break-all u-text-gray-500">
            Are you sure you want to delete “{{ path }}”?
          </p>
        </div>
      </div>
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex">
      <UButton type="submit" label="Confirm" variant="red" class="flex-shrink-0" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  path: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'close'])

const isOpen = ref(true)

function onSubmit () {
  emit('submit', props.path)
  isOpen.value = false
  onClose()
}
function onClose () {
  console.log('onClose')
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
