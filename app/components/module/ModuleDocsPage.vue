<script setup lang="ts">
import type { MarkdownDocument } from 'comark'
import { DocsProseImg, DocsProseVideo } from '#components'

defineProps<{
  page: MarkdownDocument
  editLink: string
  surround: any[]
}>()

// Hosted docs are authored for nuxt.com, so their links and media need no README rewriting.
const markdownComponents = {
  ...proseComponents,
  ProseImg: DocsProseImg,
  ProseVideo: DocsProseVideo
}
</script>

<template>
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
