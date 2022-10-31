<template>
  <DocsPage :toc="page?.toc">
    <div class="prose dark:prose-invert prose-green">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage({ querySurround: true })
</script>

<style lang="postcss" scoped>
  .prose :deep(div:first-child h1:first-child) {
    @apply mt-0 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl;
  }
  .prose :deep(div:first-child h1:first-child + p) {
    @apply mt-0 mb-8 sm:text-lg text-gray-400 pb-8 border-b border-gray-700;
    & a {
      @apply text-gray-400 hover:border-gray-700;
    }
  }

  .prose {
    max-width: 100%;
  }
  </style>
