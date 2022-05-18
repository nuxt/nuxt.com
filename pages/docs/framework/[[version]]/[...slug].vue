<template>
  <DocsPageContent>
    <div class="prose dark:prose-invert max-w-none">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </DocsPageContent>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
