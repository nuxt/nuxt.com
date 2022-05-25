<template>
  <span v-if="role" class="px-2 py-1 text-xs font-semibold border rounded-md" :class="[borderColor, backgroundColor]">{{ role }}</span>
</template>

<script setup lang="ts">
const props = defineProps({
  role: {
    type: String,
    default: ''
  }
})

const borderColor = computed(() => {
  switch (props.role) {
    case 'Ambassador':
      return 'border-teal-400'
    case 'Translator':
      return 'border-green-400'
    default:
      return 'border-green-400'
  }
})
const backgroundColor = computed(() => {
  switch (props.role) {
    case 'Ambassador':
      return 'bg-teal-50'
    case 'Translator':
      return 'bg-green-50'
    default:
      return 'bg-green-50'
  }
})
</script>
