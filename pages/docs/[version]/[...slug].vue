<template>
  <DocsPage>
    <div class="prose dark:prose-invert max-w-none">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage({ querySurround: true })
</script>
