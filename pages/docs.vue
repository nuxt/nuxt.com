<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const route = useRoute()
const { navPageFromPath } = useContentHelpers()

const links = computed(() => {
  const path = ['/docs', route.params.slug?.[0]].filter(Boolean).join('/')

  return mapContentNavigation(navPageFromPath(path, navigation.value)?.children)
})
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
