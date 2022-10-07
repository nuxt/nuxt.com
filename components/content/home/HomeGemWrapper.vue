<template>
  <ClientOnly>
    <span :class="gemWrapperClass">
      <ContentSlot :use="$slots.default" unwrap="p" />
    </span>
  </ClientOnly>
</template>
<script setup lang="ts">
defineProps({
  gemWrapperClass: {
    type: String,
    default: ''
  }
})
</script>
