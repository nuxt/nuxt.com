<template>
  <Page>
    <DocsPage>
      <div class="prose dark:prose-invert prose-green max-w-none">
        <ContentRenderer v-if="page" :value="page" />
      </div>
    </DocsPage>
  </Page>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage({ _path: '/docs/3.x/community/getting-help' })
</script>
