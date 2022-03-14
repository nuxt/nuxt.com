<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <div class="sm:flex sm:items-start">
      <div class="mt-3 text-center sm:mt-0 sm:text-left">
        <h3 class="text-lg font-medium leading-6 u-text-gray-900">
          Create branch
        </h3>
        <div class="mt-2">
          <p class="text-sm break-all u-text-gray-500">
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
    <div class="gap-3 mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <UButton type="submit" label="Save" class="justify-center flex-shrink-0 w-full sm:w-auto" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
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

const isOpen = ref(true)

function onSubmit () {
  emit('submit', name.value, props.mergeDraft)
  isOpen.value = false
  onClose()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
