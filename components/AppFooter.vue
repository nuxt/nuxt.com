<template>
  <UFooter :links="links">
    <template #left>
      <p class="text-sm text-muted">
        © 2016-{{ new Date().getFullYear() }} Nuxt - MIT License
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
