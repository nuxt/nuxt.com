<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const { mapContentNavigation } = useElementsHelpers()
const { navPageFromPath } = useContentHelpers()

const links = computed(() => mapContentNavigation(navPageFromPath('/docs', navigation.value)?.children))
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <template #top>
            <UDocsSearchButton />
          </template>

          <UNavigationTree :links="links" default-open :multiple="false" />
        </UAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
