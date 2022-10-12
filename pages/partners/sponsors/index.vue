<template>
  <ContentRenderer :value="sponsors" />
</template>

<script setup lang="ts">
const { data: sponsors } = await useAsyncData('sponsors', () => queryContent('/partners/sponsors').findOne())
</script>
