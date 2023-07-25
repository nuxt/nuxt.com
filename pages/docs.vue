<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { VerticalNavigationLink } from '@nuxthq/ui/dist/runtime/types'

const links = inject<NavItem[]>('links')
const anchors = inject<VerticalNavigationLink[]>('anchors')
</script>

<template>
  <UContainer>
    <UDocsLayout :links="links" :anchors="anchors">
      <template #top>
        <UDocsSearchButton />
      </template>
    </UDocsLayout>
  </UContainer>
</template>
