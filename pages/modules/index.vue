<template>
  <div>
    <ContentRenderer :value="page" />
  </div>
</template>

<script setup>
const { page } = useContent()

useContentHead(page.value)
</script>
