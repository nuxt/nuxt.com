<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()
const { headerLinks } = useHeaderLinks()
const { version } = useDocsVersion()

const mobileNavigation = computed<ContentNavigationItem[]>(() => {
  // Show Migration and Bridge on mobile only when user is reading them
  const docsLink = navigation.value.find(link => link.path === version.value.path)
  if (docsLink && !route.path.startsWith(`${version.value.path}/bridge`) && !route.path.startsWith(`${version.value.path}/migration`)) {
    docsLink.children = docsLink.children?.filter(link => ![`${version.value.path}/bridge`, `${version.value.path}/migration`].includes(link.path as string)) || []
  }

  return [
    docsLink,
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
