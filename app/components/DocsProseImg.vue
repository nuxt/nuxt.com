<script setup lang="ts">
import { ProseImg } from '#components'
import { CLI_DOCS_REPO } from '#shared/utils/cli-docs'

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

// SVGs such as the CLI's terminal captures can carry both colour schemes via
// `prefers-color-scheme` and SMIL animation, and rasterising them through IPX
// drops both. `none` keeps the URL untouched while retaining the default styling and
// zoom, which a plain `<img>` would lose.
const provider = computed(() => props.src.startsWith(`https://raw.githubusercontent.com/${CLI_DOCS_REPO}/`) || /\.svg(?:[?#]|$)/i.test(props.src) ? 'none' : undefined)
</script>

<template>
  <ProseImg
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :provider="provider"
  />
</template>
