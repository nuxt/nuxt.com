<template>
  <DocsPage :toc="page.toc">
    <div class="prose dark:prose-invert prose-green">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage({ querySurround: true })
</script>
