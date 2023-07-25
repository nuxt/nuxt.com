<template>
  <div>
    <ContentRenderer :value="page" />
  </div>
</template>

<script setup>
const { page } = useContent()
</script>
