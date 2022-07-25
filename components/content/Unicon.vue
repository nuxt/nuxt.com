<template>
  <div>
    <UIcon :name="icon" class="text-gray-900" :class="iconClass" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: 'w-5 h-5'
  }
})
</script>
