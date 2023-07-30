<script setup lang="ts">
import type { Link } from '@ui-kit/types'

const navigation = inject<Link[]>('navigation')
const anchors = inject<Link[]>('anchors')
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside :links="anchors">
          <template #top>
            <UDocsSearchButton />
          </template>

          <UNavigationTree :links="navigation" default-open :multiple="false" />
        </UAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
