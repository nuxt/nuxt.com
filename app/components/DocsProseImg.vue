<script setup lang="ts">
import { ProseImg } from '#components'
import { CLI_DOCS_REPO } from '#shared/utils/cli'
import { MODULE_DOCS_NAMES, moduleDocsPathPrefix } from '#shared/utils/module-docs'
import { pullBasePath } from '#shared/utils/pull'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  }
})

// Images kept next to hosted module docs (`docsMedia()`) are served by this site from the instance the page
// is read from, so the image service can't fetch them, and a preview serves the PR's commit under its prefix.
const pull = usePullPreview()
const isDocsMedia = computed(() => MODULE_DOCS_NAMES.some(name => props.src.startsWith(`${moduleDocsPathPrefix(name)}/`)))
const resolvedSrc = computed(() => isDocsMedia.value && pull.value ? pullBasePath(pull.value) + props.src : props.src)

// SVGs such as the CLI's terminal captures can carry both colour schemes via
// `prefers-color-scheme` and SMIL animation, and rasterising them through IPX
// drops both. `none` keeps the URL untouched while retaining the default styling and
// zoom, which a plain `<img>` would lose.
const provider = computed(() => props.src.startsWith(`https://raw.githubusercontent.com/${CLI_DOCS_REPO}/`) || isDocsMedia.value || /\.svg(?:[?#]|$)/i.test(props.src) ? 'none' : undefined)
</script>

<template>
  <ProseImg
    :src="resolvedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :provider="provider"
  />
</template>
