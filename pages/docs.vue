<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Link } from '@ui-kit/types'

const navigation = inject<Ref<NavItem[]>>('navigation')
const anchors = inject<Link[]>('anchors')

const { mapContentNavigation } = useUIKitContent()

const links = computed(() => mapContentNavigation(navigation.value))
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside :links="anchors">
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
