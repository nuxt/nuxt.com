<script setup lang="ts">
import type { NavItem } from '@nuxt/content'

const navigation = inject<Ref<NavItem[]>>('navigation')

defineOgImageComponent('Docs')
definePageMeta({
  heroBackground: 'opacity-30 z-20'
})

const route = useRoute()
const { navPageFromPath } = useContentHelpers()
const { headerLinks } = useNavigation()

const links = computed(() => headerLinks.value.find(link => link.to === '/docs')?.children ?? [])

const navigationLinks = computed(() => {
  const path = ['/docs', route.params.slug?.[0]].filter(Boolean).join('/')

  return mapContentNavigation(navPageFromPath(path, navigation.value)?.children || [])
})
</script>

<template>
  <UContainer>
    <UPage class="z-30">
      <template #left>
        <UAside :links="links">
          <UDivider type="dashed" class="mb-6" />

          <UNavigationTree :links="navigationLinks" default-open :multiple="false" />
        </UAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
