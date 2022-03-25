<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6">
    <UIcon name="heroicons-outline:folder" class="mx-auto h-12 w-12 u-text-gray-400" />
    <h3 class="mt-2 text-sm font-medium u-text-gray-900">
      No files in <span class="italic">content</span> directory
    </h3>
    <p class="mt-1 text-sm u-text-gray-500">
      Get started by creating a new file.
    </p>
    <div class="mt-6">
      <UButton label="Create file" size="xs" icon="heroicons-outline:plus" @click="$emit('create')" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['create'])
</script>
