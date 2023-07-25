<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/docs')
  .only(['_path', 'title', 'navigation', 'description'])
  .where({ _extension: 'md', navigation: { $ne: false } })
  .findSurround(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)
)

useContentHead(page)
</script>

<template>
  <UDocsPage v-if="page" :page="page" :surround="(surround as ParsedContent[])" />
  <UPageError v-else />
</template>
