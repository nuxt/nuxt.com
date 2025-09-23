<script setup lang="ts">
interface PageLink {
  label: string
  icon?: string
  to?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | string
  external?: boolean
}

interface Props {
  hasLinks?: boolean
  communityLinks: PageLink[]
}

defineProps<Props>()
</script>

<template>
  <USeparator v-if="hasLinks" type="dashed" />
  <UPageLinks title="Community" :links="communityLinks" />
  <USeparator type="dashed" />
  <SocialLinks />
  <Ads />
</template>
