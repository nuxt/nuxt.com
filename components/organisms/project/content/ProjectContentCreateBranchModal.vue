<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <template #header>
      <h2 class="font-medium sm:text-lg sm:leading-6 u-text-gray-900">
        Create new branch
      </h2>
    </template>

    <UInput
      v-model="name"
      name="name"
      placeholder="feat/my-feature"
      required
      class="w-full"
    />

    <template #footer>
      <div class="flex items-center justify-end">
        <UButton type="submit" label="Submit" class="flex-shrink-0" />
      </div>
    </template>
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
