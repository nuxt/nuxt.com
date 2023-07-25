<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const links = inject<NavItem[]>('links')

const headerLinks = [{
  label: 'Docs',
  icon: 'i-ph-rocket-light',
  to: '/docs'
}, {
  label: 'Modules',
  icon: 'i-ph-plug-light',
  to: '/modules'
}, {
  label: 'Showcase',
  icon: 'i-ph-sparkle-light',
  to: '/showcase'
}, {
  label: 'Enterprise',
  icon: 'i-ph-app-window-light',
  to: '/enterprise'
}, {
  label: 'Blog',
  icon: 'i-ph-newspaper-light',
  to: '/blog'
}]
</script>

<template>
  <UHeader :links="headerLinks">
    <template #logo>
      <LogoFull class="hidden w-auto h-6 sm:block" />
      <Logo class="block w-auto h-6 sm:hidden" />
    </template>

    <template #right>
      <UColorModeButton />
    </template>

    <template #links>
      <UDocsAsideLinks :links="links" />
    </template>
  </UHeader>
</template>
