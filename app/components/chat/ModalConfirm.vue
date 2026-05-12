<script setup lang="ts">
defineProps<{
  title: string
  description: string
  color?: 'error' | 'warning' | 'info' | 'success'
  confirmLabel?: string
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :ui="{ footer: 'flex-row-reverse justify-start' }"
    :close="false"
    :dismissible="false"
  >
    <template #footer>
      <UButton :color="color" :label="confirmLabel ?? 'Delete'" @click="emit('close', true)" />
      <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('close', false)" />
    </template>
  </UModal>
</template>
