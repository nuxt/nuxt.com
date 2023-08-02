<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const links = []

const { mapContentNavigation } = useElementsHelpers()
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside :links="links">
          <template #top>
            <UDocsSearchButton />
          </template>

          <UNavigationTree :links="mapContentNavigation(navigation)" default-open :multiple="false" />
        </UAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
