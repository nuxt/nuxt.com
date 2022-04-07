<template>
  <DocsPageContent>
    <div class="prose dark:prose-invert !max-w-full">
      <Content v-if="page" :document="page" />
    </div>
  </DocsPageContent>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
