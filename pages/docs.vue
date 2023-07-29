<script setup lang="ts">
import type { Link } from '@ui-kit/types'

const links = inject<Link[]>('links')
const anchors = inject<Link[]>('anchors')
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside :links="links" :anchors="anchors">
          <template #top>
            <UDocsSearchButton />
          </template>
        </UAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
