<script setup lang="ts">
import type { MarkdownDocument } from 'comark'
import { DocsProseImg } from '#components'

defineProps<{
  page: MarkdownDocument & { data?: Record<string, any> }
  /** The page's own title and description; the module page (`index.md`) has the module header instead. */
  withTitle: boolean
  editLink: string
  surround: any[]
}>()

// Hosted docs are authored for nuxt.com, so their links and images need no README rewriting.
const markdownComponents = {
  ...proseComponents,
  ProseImg: DocsProseImg
}
</script>

<template>
  <div v-if="withTitle">
    <h1 class="text-3xl font-bold text-highlighted">
      {{ page.data?.title }}
    </h1>
    <p v-if="page.data?.description" class="mt-2 text-lg text-muted">
      {{ page.data.description }}
    </p>
  </div>
  <MarkdownDocument v-if="page.nodes?.length" :value="page" :components="markdownComponents" />
  <div>
    <USeparator class="mt-6 mb-10">
      <UButton
        size="sm"
        variant="link"
        color="neutral"
        :to="editLink"
        target="_blank"
        label="Edit this page on GitHub"
      />
    </USeparator>
    <UContentSurround :surround="surround" />
  </div>
</template>
