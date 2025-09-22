<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const { headerLinks } = useHeaderLinks()

const mobileNavigation = computed<ContentNavigationItem[]>(() => {
  return [
    ...headerLinks.value[0].children.map(link => ({
      ...link,
      title: link.label,
      path: link.to
    })),
    ...headerLinks.value.slice(1).map(link => ({
      ...link,
      title: link.label,
      path: link.to,
      children: link.children?.map(child => ({
        ...child,
        title: child.label,
        path: child.to
      }))
    } as ContentNavigationItem)),
    {
      title: 'Design Kit',
      icon: 'i-lucide-palette',
      path: '/design-kit'
    }
  ].filter((item): item is ContentNavigationItem => Boolean(item))
})

const defaultOpen = computed(() => {
  const topLevelWithChildren = mobileNavigation.value.filter(link => link.children?.length)
  const currentPath = route.path

  return topLevelWithChildren.some(link => link.children?.some(child => currentPath.startsWith(child.path as string)))
})
</script>

<template>
  <UContentNavigation :navigation="mobileNavigation" :default-open="defaultOpen" highlight />
</template>
