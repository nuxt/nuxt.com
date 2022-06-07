<template>
  <span v-if="role" class="px-2 py-0.5 text-xs font-semibold capitalize border rounded-md" :class="[borderColor, backgroundColor]">{{ role }}</span>
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
    case 'ambassador':
      return 'border-teal-400 text-teal-700 dark:text-white'
    default:
      return 'border-green-400 text-green-700 dark:text-white'
  }
})
const backgroundColor = computed(() => {
  switch (props.role) {
    case 'ambassador':
      return 'bg-teal-50 dark:bg-transparent'
    default:
      return 'bg-green-50 dark:bg-transparent'
  }
})
</script>
