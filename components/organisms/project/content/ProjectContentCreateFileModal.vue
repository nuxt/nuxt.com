<template>
  <UModal v-model="isOpen" appear @close="onClose" @submit.prevent="onSubmit">
    <template #header>
      <h2 class="font-medium sm:text-lg sm:leading-6 u-text-gray-900">
        Create new file
      </h2>
    </template>

    <div class="flex items-center gap-3">
      <div class="flex items-center flex-1">
        <span v-if="path" class="flex-shrink-0 max-w-[200px] truncate px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-text-gray-500">
          {{ path }}/
        </span>

        <UInput
          v-model="name"
          name="name"
          placeholder="faq/index.md"
          required
          autofocus
          class="w-full"
          :custom-class="path && 'rounded-l-none'"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <UButton type="submit" label="Save" class="flex-shrink-0" />
      </div>
    </template>
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

const name = ref('')

const isOpen = ref(true)

function onSubmit () {
  emit('submit', [props.path, name.value].join('/'))
  isOpen.value = false
  onClose()
}
function onClose () {
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
