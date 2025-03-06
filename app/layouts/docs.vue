<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()

const asideNavigation = computed(() => {
  const path = ['/docs', route.params.slug?.[0]].filter(Boolean).join('/')

  return navPageFromPath(path, navigation.value)?.children || []
})

const { headerLinks } = useNavigation()

const links = computed(() => headerLinks.value.find(link => link.to === '/docs')?.children ?? [])
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UPageAnchors :links="links" />

            <USeparator type="dashed" class="my-6" />

            <UContentNavigation
              :navigation="asideNavigation"
              default-open
              trailing-icon="i-lucide-chevron-right"
              :ui="{ linkTrailingIcon: 'group-data-[state=open]:rotate-90' }"
              highlight
            />
          </UPageAside>
        </template>

        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
