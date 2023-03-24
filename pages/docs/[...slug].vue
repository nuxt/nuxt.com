<template>
  <DocsPage :toc="hasToc">
    <ContentRenderer v-if="page" :value="page" />
    <div class="u-text-gray-500 py-6 border-t u-border-gray-200 mt-4">
      <NuxtLink :to="githubLink" class="hover:text-green-400" target="_blank" rel="noreferer noopener">
        <Icon name="uil:edit" />
        Edit on Github
      </NuxtLink>
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page } = useContent()

usePageNotFound(page)

const githubLink = computed(() => `https://github.com/nuxt/nuxt/edit/main/${page?.value?._file}`)

const hasToc = computed(() => !!page.value?.body?.toc?.links?.length)
</script>
