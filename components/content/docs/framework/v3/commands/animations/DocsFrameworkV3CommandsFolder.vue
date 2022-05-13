<template>
  <div class="flex flex-col justify-center items-center gap-y-2">
    <img :src="`/docs/framework/v3/commands/${folder ? 'folder' : 'file' }.svg`">
    <span class="text-gray-600">
      {{ label }}
    </span>
  </div>
</template>
<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: ''
  },
  folder: {
    type: Boolean,
    default: false
  }
})
</script>
