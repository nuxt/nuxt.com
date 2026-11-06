<script setup lang="ts">
import type { PageLink } from '@nuxt/ui'

interface Props {
  hasLinks?: boolean
  communityLinks: PageLink[]
  drawer?: boolean
}

defineProps<Props>()
</script>

<template>
  <USeparator v-if="hasLinks" type="dashed" />
  <template v-if="$slots.default">
    <slot />
    <USeparator type="dashed" />
  </template>
  <UPageLinks title="Community" :links="communityLinks" />
  <USeparator type="dashed" />
  <SocialLinks />
</template>
