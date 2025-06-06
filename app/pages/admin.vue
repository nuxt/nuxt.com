<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { data: feedback } = await useFetch('/api/feedback')
</script>

<template>
  <div>
    <pre>{{ feedback }}</pre>
  </div>
</template>

<style scoped>

</style>
