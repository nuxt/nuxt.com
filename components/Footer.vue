<template>
  <UFooter :links="links" :ui="{ bottom: 'border-t', container: '!py-6' }">
    <template #top>
      <FooterColumns />
    </template>

    <template #left>
      Powered by <NuxtLink to="ui.nuxtlabs.com">
        UI
      </NuxtLink> and <NuxtLink to="https://elements.nuxtlabs.com">
        Elements
      </NuxtLink>
    </template>

    <template #center>
      <p class="text-muted">
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - MIT License
      </p>
    </template>

    <template #right>
      <USocialButton to="https://twitter.com/nuxt_js" icon="i-simple-icons-twitter" />
      <USocialButton to="https://discord.com/invite/ps2h6QT" icon="i-simple-icons-discord" />
      <USocialButton to="https://github.com/nuxt/nuxt" icon="i-simple-icons-github" />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
import type { Link } from '@ui-kit/types'

defineProps<{
  links?: Link[]
}>()
</script>
