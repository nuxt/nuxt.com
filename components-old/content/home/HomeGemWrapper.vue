<template>
  <div :class="gemWrapperClass">
    <ContentSlot :use="$slots.default" unwrap="p" />
  </div>
</template>
<script setup lang="ts">
defineProps({
  gemWrapperClass: {
    type: String,
    default: ''
  }
})
</script>
