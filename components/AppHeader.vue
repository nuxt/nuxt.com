<script setup lang="ts">
import type { Link } from '@ui-kit/types'

const links = inject<Link[]>('links')

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
      <USocialButton to="https://twitter.com/nuxt_js" icon="i-simple-icons-twitter" class="hidden lg:inline-flex" />
      <USocialButton to="https://discord.com/invite/ps2h6QT" icon="i-simple-icons-discord" class="hidden lg:inline-flex" />
      <USocialButton to="https://github.com/nuxt/nuxt" icon="i-simple-icons-github" class="hidden lg:inline-flex" />
    </template>

    <template #links>
      <UAsideLinks :links="links" />
    </template>
  </UHeader>
</template>
