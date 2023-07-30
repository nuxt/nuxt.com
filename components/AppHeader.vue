<script setup lang="ts">
import type { Link } from '@ui-kit/types'

const navigation = inject<Link[]>('navigation')

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

      <UButton
        icon="i-octicon-star-fill-24"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        label="46.6k"
        color="gray"
        variant="ghost"
      />
    </template>

    <template #panel>
      <UNavigationTree :links="navigation" default-open :multiple="false" />
    </template>
  </UHeader>
</template>
