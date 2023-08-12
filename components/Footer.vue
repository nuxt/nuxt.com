<template>
  <UFooter
    :links="links"
    :ui="{
      bottom: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: '!py-6' },
      top: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: 'py-8 lg:py-12' }
    }"
  >
    <template #top>
      <FooterColumns />
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
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
import type { Link } from '@elements/types'

defineProps<{
  links?: Link[]
}>()
</script>
