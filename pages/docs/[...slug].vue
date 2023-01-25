<template>
  <DocsPage :toc="hasToc">
    <ContentRenderer v-if="page" :value="page" />
    <div class="u-text-gray-500 py-6 border-t u-border-gray-200 mt-4">
      <NuxtLink :to="githubLink" class="hover:text-green-400" target="_blank" rel="noreferer noopener">
        <Icon name="uil:edit" /> Edit on Github
      </NuxtLink>
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page } = useContent()

usePageNotFound(page)

const githubLink = computed(() => `https://github.com/nuxt/nuxt/edit/main/${page?.value?._file}`)

const hasToc = computed(() => !!page.value?.body?.toc?.links?.length)

useContentHead(page)
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
