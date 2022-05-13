<template>
  <DocsPageContent>
    <div class="prose dark:prose-invert max-w-none">
      <Document v-if="page" v-model="page" />
    </div>
  </DocsPageContent>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
