<template>
  <UFooter :links="links">
    <template #left>
      © 2016-{{ new Date().getFullYear() }} Nuxt - MIT License
    </template>

    <template #right>
      <USocialButton to="https://twitter.com/nuxt_js" icon="i-simple-icons-twitter" />
      <USocialButton to="https://discord.com/invite/ps2h6QT" icon="i-simple-icons-discord" />
      <USocialButton to="https://github.com/nuxt/nuxt" icon="i-simple-icons-github" />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
const links = [{
  label: 'NuxtLabs',
  to: 'https://nuxtlabs.com/',
  target: '_blank'
}, {
  label: 'Nuxt Studio',
  to: 'https://nuxt.studio/',
  target: '_blank'
}]
</script>
