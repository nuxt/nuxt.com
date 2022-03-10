<template>
  <UModal v-model="isOpen" @submit.prevent="submitFile">
    <template #header>
      <h2 class="font-medium sm:text-lg sm:leading-6 u-text-gray-900">
        Create new file
      </h2>
    </template>

    <div class="flex items-center gap-3">
      <div class="flex items-center flex-1">
        <span v-if="folder" class="flex-shrink-0 max-w-[200px] truncate px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-text-gray-500">
          {{ folder }}/
        </span>

        <UInput
          v-model="filePath"
          name="filePath"
          placeholder="faq/index.md"
          required
          autofocus
          class="w-full"
          :custom-class="folder && 'rounded-l-none'"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <UButton type="submit" label="Submit" class="flex-shrink-0" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const filePath = ref('')

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

function submitFile () {
  emit('submit', [props.folder, filePath.value].join('/'))
  isOpen.value = false
}
</script>
