<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mt-3 text-center sm:mt-0 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Revert file
        </h3>
        <div class="mt-2">
          <p class="text-sm break-all u-text-gray-500">
            Are you sure you want to revert changes you made on “{{ name }}”?
          </p>
        </div>
      </div>
    </div>
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Revert" variant="amber" class="justify-center flex-shrink-0 w-full sm:w-auto" />
      <UButton type="button" label="Cancel" variant="secondary" class="justify-center flex-shrink-0 w-full mt-3 sm:w-auto sm:mt-0" @click="close" />
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

const [name] = props.path.split('/').reverse()

const emit = defineEmits(['submit', 'close'])

const isOpen = ref(true)

function onSubmit () {
  emit('submit', props.path)
  isOpen.value = false
  onClose()
}
function close () {
  isOpen.value = false
  onClose()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
