<template>
  <UModal v-model="isOpen" @submit.prevent="submitBranch">
    <template #header>
      <h2 class="font-medium sm:text-lg sm:leading-6 u-text-gray-900">
        Create new branch
      </h2>
    </template>

    <UInput
      v-model="branchName"
      name="branchName"
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
  modelValue: {
    type: Boolean,
    default: false
  },
  branch: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'createBranch'])

const branchName = ref('')

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

watchEffect(() => {
  // on modal show, set the branch name
  if (props.modelValue) {
    branchName.value = props.branch
  }
})

function submitBranch () {
  emit('createBranch', branchName.value)
  isOpen.value = false
}
</script>
