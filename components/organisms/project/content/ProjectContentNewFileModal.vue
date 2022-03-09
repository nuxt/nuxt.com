<template>
  <UModal v-model="isOpen">
    <form class="flex items-center gap-3" @submit.prevent="submitFile">
      <div class="flex flex-1 items-center">
        <span v-if="folder" class="max-w-[200px] px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
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
          @keyup.enter="submitFile"
        />
      </div>

      <UButton
        type="submit"
        label="Create file"
        class="flex-shrink-0"
      />
    </form>
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
  emit('submit', filePath.value)
  isOpen.value = false
}
</script>
