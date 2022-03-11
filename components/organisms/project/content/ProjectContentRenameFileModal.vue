<template>
  <UModal v-model="isOpen" @submit.prevent="onSubmit">
    <template #header>
      <h2 class="font-medium sm:text-lg sm:leading-6 u-text-gray-900">
        Rename file
      </h2>
    </template>

    <div class="flex items-center gap-3">
      <div class="flex items-center flex-1">
        <span v-if="folder" class="flex-shrink-0 max-w-[200px] truncate px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-text-gray-500">
          {{ folder }}/
        </span>

        <UInput
          v-model="newName"
          name="name"
          placeholder="faq/index.md"
          required
          autofocus
          class="w-full"
          custom-class="rounded-l-none"
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
  modelValue: {
    type: Boolean,
    default: false
  },
  oldPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

console.log('props.oldPath', props.oldPath)

const folder = ref('')
const oldName = ref('')
const newName = ref('')

watchEffect(() => {
  // on modal show, set the branch name
  if (props.modelValue) {
    const [name, ...dir] = props.oldPath.split('/').reverse()
    folder.value = dir.reverse().join('/')
    oldName.value = name
    newName.value = name
  }
})

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

function onSubmit () {
  emit('submit', props.oldPath, [folder.value, newName.value].join('/'))
  isOpen.value = false
  newName.value = ''
}
</script>
