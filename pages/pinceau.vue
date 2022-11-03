<template>
  <Page>
    <div>
      <ContentRenderer :value="page" class="prose" />
    </div>
  </Page>
</template>
<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage()
</script>

<style scoped>
.prose {
  max-width: max-content;
}
</style>
