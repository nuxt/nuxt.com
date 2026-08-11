<script setup lang="ts">
import type { ContentNavigationItem } from '~/utils/content'

const { headerLinks } = useHeaderLinks()

const mobileNavigation = computed<ContentNavigationItem[]>(() => {
  return [
    ...headerLinks.value.map((link): ContentNavigationItem => ({
      ...link,
      title: link.label,
      path: link.to,
      icon: link.children?.length ? undefined : link.icon,
      children: link.children?.map((child): ContentNavigationItem => ({
        ...child,
        title: child.label,
        path: child.to
      }))
    })),
    {
      title: 'Design Kit',
      icon: 'i-lucide-palette',
      path: '/design-kit'
    }
  ]
})
</script>

<template>
  <UContentNavigation
    :navigation="mobileNavigation"
    :collapsible="false"
    variant="link"
    highlight
    :ui="{
      trigger: 'font-medium data-[state=open]:text-toned tracking-wide text-[11px] uppercase',
      link: 'data-[state=open]:text-muted',
      linkLeadingIcon: 'group-data-[state=open]:text-muted'
    }"
  />
</template>
