<script setup lang="ts">
import { MODULE_DOCS_NAMES, moduleDocsPathPrefix } from '#shared/utils/module-docs'
import { pullBasePath } from '#shared/utils/pull'

defineProps({
  src: {
    type: String,
    default: undefined
  },
  poster: {
    type: String,
    default: undefined
  }
})

// Videos kept next to hosted module docs (`docsMedia()`) are served by this site from the instance the page
// is read from, so a preview serves the PR's commit under its prefix, as `DocsProseImg` does for images.
const pull = usePullPreview()
function resolve(url?: string): string | undefined {
  return url && pull.value && MODULE_DOCS_NAMES.some(name => url.startsWith(`${moduleDocsPathPrefix(name)}/`)) ? pullBasePath(pull.value) + url : url
}
</script>

<template>
  <video :src="resolve(src)" :poster="resolve(poster)" class="w-full h-auto rounded-md">
    <slot />
  </video>
</template>
