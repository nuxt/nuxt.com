<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page } = useContent()

definePageMeta({
  layoutTransition: false,
  middleware: ['page']
})
</script>
