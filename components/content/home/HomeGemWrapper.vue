<template>
  <ClientOnly fallback-tag="div">
    <div :class="gemWrapperClass">
      <ContentSlot :use="$slots.default" unwrap="p" />
    </div>
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
